from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
FREE_SHIPPING_THRESHOLD = 100.0
SHIPPING_FLAT = 8.0
KIT_DISCOUNT_RATE = 0.20
KIT_MIN_ITEMS = 3
REFERRAL_AMOUNT = 10.0

logger = logging.getLogger(__name__)


def utcnow():
    return datetime.now(timezone.utc)


# ---------------- US State Tax Engine (ZIP3 -> state -> combined avg rate) ----------------

STATE_RATES = {
    "AL": 0.0929, "AK": 0.0182, "AZ": 0.0837, "AR": 0.0944, "CA": 0.0885, "CO": 0.0781,
    "CT": 0.0635, "DE": 0.0, "DC": 0.065, "FL": 0.0702, "GA": 0.0738, "HI": 0.045,
    "ID": 0.0603, "IL": 0.0886, "IN": 0.07, "IA": 0.0694, "KS": 0.0865, "KY": 0.06,
    "LA": 0.0956, "ME": 0.055, "MD": 0.06, "MA": 0.0625, "MI": 0.06, "MN": 0.0749,
    "MS": 0.0707, "MO": 0.0829, "MT": 0.0, "NE": 0.0697, "NV": 0.0824, "NH": 0.0,
    "NJ": 0.066, "NM": 0.0762, "NY": 0.0853, "NC": 0.07, "ND": 0.0697, "OH": 0.0724,
    "OK": 0.0899, "OR": 0.0, "PA": 0.0634, "RI": 0.07, "SC": 0.0743, "SD": 0.0611,
    "TN": 0.0955, "TX": 0.082, "UT": 0.0719, "VT": 0.0636, "VA": 0.0577, "WA": 0.0938,
    "WV": 0.0657, "WI": 0.057, "WY": 0.0544,
}

ZIP_RANGES = [
    (5, 5, "NY"), (10, 27, "MA"), (28, 29, "RI"), (30, 38, "NH"), (39, 49, "ME"),
    (50, 59, "VT"), (60, 69, "CT"), (70, 89, "NJ"), (100, 149, "NY"), (150, 196, "PA"),
    (197, 199, "DE"), (200, 205, "DC"), (201, 201, "VA"), (206, 219, "MD"), (220, 246, "VA"),
    (247, 268, "WV"), (270, 289, "NC"), (290, 299, "SC"), (300, 319, "GA"), (320, 349, "FL"),
    (350, 369, "AL"), (370, 385, "TN"), (386, 397, "MS"), (398, 399, "GA"), (400, 427, "KY"),
    (430, 459, "OH"), (460, 479, "IN"), (480, 499, "MI"), (500, 528, "IA"), (530, 549, "WI"),
    (550, 567, "MN"), (570, 577, "SD"), (580, 588, "ND"), (590, 599, "MT"), (600, 629, "IL"),
    (630, 658, "MO"), (660, 679, "KS"), (680, 693, "NE"), (700, 714, "LA"), (716, 729, "AR"),
    (730, 749, "OK"), (750, 799, "TX"), (800, 816, "CO"), (820, 831, "WY"), (832, 838, "ID"),
    (840, 847, "UT"), (850, 865, "AZ"), (870, 884, "NM"), (889, 898, "NV"), (900, 961, "CA"),
    (967, 968, "HI"), (970, 979, "OR"), (980, 994, "WA"), (995, 999, "AK"),
]


def state_from_zip(zip_code: str) -> Optional[str]:
    if not zip_code or not re.match(r"^\d{5}", zip_code):
        return None
    prefix = int(zip_code[:3])
    for start, end, state in ZIP_RANGES:
        if start <= prefix <= end:
            return state
    return None


# ---------------- Auth ----------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": utcnow() + timedelta(minutes=30), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": utcnow() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie("access_token", create_access_token(user_id, email), httponly=True, secure=True, samesite="none", max_age=1800, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(user: dict) -> dict:
    return {
        "id": user["id"], "name": user["name"], "email": user["email"], "role": user.get("role", "user"),
        "referral_code": user.get("referral_code"), "credit_balance": round(user.get("credit_balance", 0), 2),
    }


async def new_referral_code() -> str:
    while True:
        code = "CLIFF-" + secrets.token_hex(3).upper()
        if not await db.users.find_one({"referral_code": code}) and not await db.promo_codes.find_one({"code": code}):
            return code


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class RegisterBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@api_router.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    code = await new_referral_code()
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "user",
        "referral_code": code,
        "credit_balance": 0.0,
        "created_at": utcnow().isoformat(),
    }
    await db.users.insert_one(user)
    await db.promo_codes.insert_one({
        "code": code, "type": "referral", "value": REFERRAL_AMOUNT,
        "owner_user_id": user["id"], "active": True, "uses": 0, "created_at": utcnow().isoformat(),
    })
    set_auth_cookies(response, user["id"], email)
    return public_user(user)


@api_router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until") and datetime.fromisoformat(attempt["locked_until"]) > utcnow():
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"identifier": identifier, "count": count, "updated_at": utcnow().isoformat()}
        if count >= 5:
            update["locked_until"] = (utcnow() + timedelta(minutes=15)).isoformat()
            update["count"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, user["id"], email)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["id"], user["email"]), httponly=True, secure=True, samesite="none", max_age=1800, path="/")
    return {"ok": True}


# ---------------- Products ----------------

PETS = ("dog", "cat")
GROUPS = ("walking", "resting", "grooming", "toys", "accessories")

SEED_PRODUCTS = [
    {"name": "Tactical Harness Set", "pet": "dog", "group": "walking", "subtype": "harness", "color": "Jet Black", "price": 58.0, "stock": 42, "rating": 4.9, "featured": True,
     "image": "https://images.pexels.com/photos/1591939/pexels-photo-1591939.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Military-grade nylon harness with MOLLE panels, quick-release buckles and a reinforced top handle. Built for dogs that pull like they mean it."},
    {"name": "AirTag Padded Harness", "pet": "dog", "group": "walking", "subtype": "harness", "color": "Jet Black", "price": 64.0, "stock": 35, "rating": 4.8, "featured": True,
     "image": "https://images.pexels.com/photos/733416/pexels-photo-733416.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Cloud-padded chest plate with a hidden, waterproof AirTag pocket. Track every escape artist in silence."},
    {"name": "Reflective Front Harness", "pet": "dog", "group": "walking", "subtype": "harness", "color": "Graphite", "price": 46.0, "stock": 51, "rating": 4.7, "featured": False,
     "image": "https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "360-degree reflective piping with a front-clip D-ring that turns pullers into walkers. Night walks, upgraded."},
    {"name": "Bungee Reflexive Leash", "pet": "dog", "group": "walking", "subtype": "leash", "color": "Jet Black", "price": 32.0, "stock": 68, "rating": 4.8, "featured": True,
     "image": "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Shock-absorbing bungee core saves your shoulder on sudden sprints. Reflective weave, matte black hardware."},
    {"name": "Padded Nylon Leash", "pet": "dog", "group": "walking", "subtype": "leash", "color": "Storm Grey", "price": 26.0, "stock": 74, "rating": 4.6, "featured": False,
     "image": "https://assets.mixkit.co/videos/1532/1532-thumb-360-0.jpg",
     "description": "Six feet of double-stitched nylon with a neoprene-padded handle. The everyday leash, perfected."},
    {"name": "AirTag Collar", "pet": "dog", "group": "walking", "subtype": "collar", "color": "Jet Black", "price": 38.0, "stock": 59, "rating": 4.9, "featured": True,
     "image": "https://images.unsplash.com/photo-1546687813-3fcc1c363a07?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "Full-grain collar with an integrated AirTag sleeve and solid brass buckle. Never lose the trail."},
    {"name": "Reflective Collar", "pet": "dog", "group": "walking", "subtype": "collar", "color": "Graphite", "price": 28.0, "stock": 63, "rating": 4.5, "featured": False,
     "image": "https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "High-visibility reflective banding on a feather-light frame. Seen from a block away."},
    {"name": "Orthopedic Bolster Bed", "pet": "dog", "group": "resting", "subtype": "bed", "color": "Bone", "price": 120.0, "stock": 21, "rating": 5.0, "featured": True,
     "image": "https://images.unsplash.com/photo-1650453208424-bb782a8168fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "Vet-spec memory foam base with a wraparound bolster for head-resting. Machine-washable monochrome cover."},
    {"name": "Interactive Enrichment Toy", "pet": "dog", "group": "toys", "subtype": "enrichment", "color": "Jet Black", "price": 24.0, "stock": 88, "rating": 4.7, "featured": True,
     "image": "https://images.unsplash.com/photo-1591946614720-90a587da4a36?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "Treat-dispensing puzzle core wrapped in natural rubber. Turns mealtime into a brain game."},
    {"name": "Chew Module", "pet": "dog", "group": "toys", "subtype": "chew", "color": "Storm Grey", "price": 18.0, "stock": 96, "rating": 4.6, "featured": False,
     "image": "https://images.pexels.com/photos/617278/pexels-photo-617278.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Interlocking natural-rubber chew blocks for aggressive chewers. Freeze with broth for long afternoons."},
    {"name": "Puzzle Snuffle Mat", "pet": "dog", "group": "toys", "subtype": "puzzle", "color": "Bone", "price": 30.0, "stock": 44, "rating": 4.8, "featured": False,
     "image": "https://images.unsplash.com/photo-1549297161-14f79605a74c?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "Layered foraging mat that slows fast eaters and tires busy minds. Folds flat, machine washable."},
    {"name": "Feather Chase Wand", "pet": "cat", "group": "toys", "subtype": "wand", "color": "Jet Black", "price": 16.0, "stock": 112, "rating": 4.7, "featured": False,
     "image": "https://images.pexels.com/photos/825947/pexels-photo-825947.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Feather-light carbon wand with replaceable organic feather lures. Engineered for aerial hunters."},
    {"name": "Reflective Harness Set", "pet": "cat", "group": "walking", "subtype": "harness", "color": "Graphite", "price": 42.0, "stock": 37, "rating": 4.8, "featured": True,
     "image": "https://images.pexels.com/photos/7210548/pexels-photo-7210548.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Escape-proof H-frame harness with reflective trim and a matching 4-foot leash. City-cat certified."},
    {"name": "Everyday Harness Set", "pet": "cat", "group": "walking", "subtype": "harness", "color": "Bone", "price": 36.0, "stock": 41, "rating": 4.6, "featured": False,
     "image": "https://images.unsplash.com/photo-1715257492511-3582a355928f?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "Soft-mesh step-in harness with leash, cut for feline shoulders. Zero-fuss walks begin here."},
    {"name": "Printed Cat Collar", "pet": "cat", "group": "walking", "subtype": "collar", "color": "Monochrome Print", "price": 22.0, "stock": 58, "rating": 4.5, "featured": False,
     "image": "https://images.pexels.com/photos/320014/pexels-photo-320014.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Breakaway safety buckle in a limited monochrome print, with a removable gunmetal bell."},
    {"name": "Reflective Cat Collar", "pet": "cat", "group": "walking", "subtype": "collar", "color": "Graphite", "price": 20.0, "stock": 66, "rating": 4.6, "featured": False,
     "image": "https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Featherweight reflective collar with breakaway clasp. For cats that own the night."},
    {"name": "Slicker Brush", "pet": "dog", "group": "grooming", "subtype": "brush", "color": "Jet Black", "price": 22.0, "stock": 79, "rating": 4.7, "featured": False,
     "image": "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Fine bent-wire pins on a matte black walnut handle. Glides through double coats without the drama."},
    {"name": "Stainless Comb", "pet": "dog", "group": "grooming", "subtype": "comb", "color": "Steel", "price": 16.0, "stock": 84, "rating": 4.5, "featured": False,
     "image": "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Dual-density stainless teeth for detangling and finishing. The groomer's secret, at home."},
    {"name": "Silicone Dental Set", "pet": "dog", "group": "grooming", "subtype": "dental", "color": "Storm Grey", "price": 14.0, "stock": 91, "rating": 4.4, "featured": False,
     "image": "https://images.pexels.com/photos/257540/pexels-photo-257540.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Three food-grade silicone finger brushes in graduated textures. Fresh breath in sixty seconds a day."},
    {"name": "Pet Goggles", "pet": "dog", "group": "accessories", "subtype": "goggles", "color": "Jet Black", "price": 28.0, "stock": 33, "rating": 4.8, "featured": True,
     "image": "https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "UV400 shatterproof lenses on an adjustable low-profile strap. For car windows, trails, and attitude."},
    {"name": "AirTag Holder", "pet": "dog", "group": "accessories", "subtype": "airtag", "color": "Jet Black", "price": 14.0, "stock": 120, "rating": 4.6, "featured": False,
     "image": "https://images.pexels.com/photos/4445456/pexels-photo-4445456.jpeg?auto=compress&cs=tinysrgb&w=940",
     "description": "Flush-mount silicone AirTag sleeve that slides onto any collar up to 1 inch. Silent, secure, invisible."},
    {"name": "Travel Water Bottle", "pet": "dog", "group": "accessories", "subtype": "bottle", "color": "Storm Grey", "price": 24.0, "stock": 57, "rating": 4.7, "featured": False,
     "image": "https://images.unsplash.com/photo-1714068691210-073dc52c6c1d?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
     "description": "One-hand squeeze bottle with an integrated drinking trough and leak-lock cap. Hydration, mid-stride."},
]


def product_doc(p: dict) -> dict:
    return {k: p[k] for k in ("id", "name", "pet", "group", "subtype", "color", "price", "stock", "rating", "featured", "image", "description")}


class ProductBody(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    pet: str
    group: str
    subtype: str = Field(default="accessory", max_length=40)
    color: str = Field(default="Jet Black", max_length=40)
    price: float = Field(gt=0, le=100000)
    stock: int = Field(ge=0, le=100000)
    rating: float = Field(default=5.0, ge=0, le=5)
    featured: bool = False
    image: str = Field(min_length=1)
    description: str = Field(default="", max_length=2000)


@api_router.get("/products")
async def list_products(pet: Optional[str] = None, group: Optional[str] = None, subtype: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if pet and pet in PETS:
        query["pet"] = pet
    if group and group in GROUPS:
        query["group"] = group
    if subtype:
        query["subtype"] = subtype
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    return await db.products.find(query, {"_id": 0}).sort("name", 1).to_list(500)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.post("/products", status_code=201)
async def create_product(body: ProductBody, admin: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.products.insert_one(doc)
    return product_doc(doc)


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductBody, admin: dict = Depends(require_admin)):
    result = await db.products.update_one({"id": product_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ---------------- Tax, Promo & Referral ----------------

@api_router.get("/tax/quote")
async def tax_quote(zip: str):
    state = state_from_zip(zip)
    if not state:
        return {"zip": zip, "state": None, "rate": 0.0, "note": "Enter a valid US ZIP for exact rates"}
    return {"zip": zip, "state": state, "rate": STATE_RATES[state], "note": f"Estimated {state} combined state/local rate"}


class PromoValidateBody(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    merchandise_total: float = Field(ge=0)


async def find_promo(code: str) -> Optional[dict]:
    return await db.promo_codes.find_one({"code": code.strip().upper(), "active": True}, {"_id": 0})


def promo_discount_for(promo: dict, base: float) -> float:
    if promo["type"] == "percent":
        return round(base * promo["value"] / 100.0, 2)
    if promo["type"] == "fixed":
        return round(min(promo["value"], base), 2)
    if promo["type"] == "referral":
        return round(min(REFERRAL_AMOUNT, base), 2) if base >= 20 else 0.0
    return 0.0


@api_router.post("/promo/validate")
async def promo_validate(body: PromoValidateBody, request: Request):
    promo = await find_promo(body.code)
    if not promo:
        raise HTTPException(status_code=404, detail="Code not recognized")
    user = await get_optional_user(request)
    if promo["type"] == "referral":
        if user and promo.get("owner_user_id") == user["id"]:
            raise HTTPException(status_code=400, detail="You can't use your own referral code")
        if body.merchandise_total < 20:
            raise HTTPException(status_code=400, detail="Referral codes need a $20+ merchandise total")
    discount = promo_discount_for(promo, body.merchandise_total)
    label = {"percent": f"{promo['value']:g}% off", "fixed": f"${promo['value']:g} off", "referral": "$10 referral credit"}[promo["type"]]
    return {"code": promo["code"], "type": promo["type"], "discount": discount, "label": label}


class PromoCreateBody(BaseModel):
    code: str = Field(min_length=3, max_length=24)
    type: str
    value: float = Field(gt=0, le=10000)


@api_router.get("/admin/promos")
async def admin_list_promos(admin: dict = Depends(require_admin)):
    promos = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    owner_ids = [p["owner_user_id"] for p in promos if p.get("owner_user_id")]
    owners = {u["id"]: u["email"] async for u in db.users.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "email": 1})}
    for p in promos:
        p["owner_email"] = owners.get(p.get("owner_user_id"))
    return promos


@api_router.post("/admin/promos", status_code=201)
async def admin_create_promo(body: PromoCreateBody, admin: dict = Depends(require_admin)):
    if body.type not in ("percent", "fixed"):
        raise HTTPException(status_code=400, detail="Type must be percent or fixed")
    if body.type == "percent" and body.value > 90:
        raise HTTPException(status_code=400, detail="Percent codes capped at 90%")
    code = body.code.strip().upper().replace(" ", "")
    if await db.promo_codes.find_one({"code": code}):
        raise HTTPException(status_code=409, detail="Code already exists")
    doc = {"code": code, "type": body.type, "value": body.value, "owner_user_id": None, "active": True, "uses": 0, "created_at": utcnow().isoformat()}
    await db.promo_codes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


class PromoPatchBody(BaseModel):
    active: bool


@api_router.patch("/admin/promos/{code}")
async def admin_toggle_promo(code: str, body: PromoPatchBody, admin: dict = Depends(require_admin)):
    result = await db.promo_codes.update_one({"code": code.upper()}, {"$set": {"active": body.active}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"ok": True}


@api_router.delete("/admin/promos/{code}")
async def admin_delete_promo(code: str, admin: dict = Depends(require_admin)):
    result = await db.promo_codes.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"ok": True}


# ---------------- Site settings & newsletter ----------------

@api_router.get("/settings/public")
async def public_settings():
    site = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return {
        "announcement_enabled": bool(site and site.get("announcement_enabled")),
        "announcement_text": (site or {}).get("announcement_text", "Free US shipping over $100"),
    }


class SettingsBody(BaseModel):
    announcement_enabled: bool = False
    announcement_text: str = Field(default="Free US shipping over $100", max_length=200)


@api_router.put("/admin/settings")
async def update_settings(body: SettingsBody, admin: dict = Depends(require_admin)):
    await db.settings.update_one({"id": "site"}, {"$set": body.model_dump()}, upsert=True)
    return {"ok": True}


class NewsletterBody(BaseModel):
    email: EmailStr


@api_router.post("/newsletter")
async def newsletter_signup(body: NewsletterBody):
    await db.newsletter.update_one(
        {"email": body.email.lower()},
        {"$setOnInsert": {"email": body.email.lower(), "created_at": utcnow().isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ---------------- Checkout & Payments ----------------

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=50)
    kit_id: Optional[str] = None


class CheckoutBody(BaseModel):
    items: List[CartItem] = Field(min_length=1)
    origin_url: str
    promo_code: Optional[str] = None
    zip: Optional[str] = None


def compute_kit_savings(items: List[dict]) -> float:
    groups = {}
    for it in items:
        if it.get("kit_id"):
            groups.setdefault(it["kit_id"], []).append(it)
    savings = 0.0
    for g in groups.values():
        if len(g) >= KIT_MIN_ITEMS:
            savings += sum(i["price"] * i["quantity"] for i in g) * KIT_DISCOUNT_RATE
    return round(savings, 2)


async def mark_order_paid(session_id: str):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn or txn.get("payment_status") == "paid":
        return
    await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "updated_at": utcnow().isoformat()}},
    )
    order = await db.orders.find_one({"session_id": session_id})
    if not order or order.get("payment_status") == "paid":
        return
    await db.orders.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": "paid", "status": "Processing", "updated_at": utcnow().isoformat()}},
    )
    for item in order.get("items", []):
        await db.products.update_one({"id": item["product_id"]}, {"$inc": {"stock": -item["quantity"]}})
    if order.get("promo_type") == "referral" and order.get("referral_owner_id"):
        await db.users.update_one({"id": order["referral_owner_id"]}, {"$inc": {"credit_balance": REFERRAL_AMOUNT}})
        await db.promo_codes.update_one({"code": order["promo_code"]}, {"$inc": {"uses": 1}})
        await db.referral_uses.insert_one({
            "code": order["promo_code"], "owner_user_id": order["referral_owner_id"],
            "order_id": order["id"], "amount": REFERRAL_AMOUNT, "created_at": utcnow().isoformat(),
        })
    elif order.get("promo_code"):
        await db.promo_codes.update_one({"code": order["promo_code"]}, {"$inc": {"uses": 1}})
    if order.get("credit_applied", 0) > 0 and order.get("user_id"):
        await db.users.update_one({"id": order["user_id"]}, {"$inc": {"credit_balance": -order["credit_applied"]}})


@api_router.post("/payments/checkout")
async def create_checkout(body: CheckoutBody, request: Request):
    user = await get_optional_user(request)
    line_items = []
    subtotal = 0.0
    for item in body.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        subtotal += round(product["price"] * item.quantity, 2)
        line_items.append({
            "product_id": product["id"], "name": product["name"], "price": product["price"],
            "quantity": item.quantity, "image": product["image"], "kit_id": item.kit_id,
        })

    kit_savings = compute_kit_savings(line_items)
    merchandise = round(subtotal - kit_savings, 2)

    promo = None
    promo_discount = 0.0
    if body.promo_code:
        promo = await find_promo(body.promo_code)
        if not promo:
            raise HTTPException(status_code=400, detail="Promo code not recognized")
        if promo["type"] == "referral":
            if user and promo.get("owner_user_id") == user["id"]:
                raise HTTPException(status_code=400, detail="You can't use your own referral code")
            if merchandise < 20:
                raise HTTPException(status_code=400, detail="Referral codes need a $20+ merchandise total")
        promo_discount = promo_discount_for(promo, merchandise)
    merchandise = round(merchandise - promo_discount, 2)

    credit_applied = 0.0
    if user:
        balance = float(user.get("credit_balance", 0) or 0)
        if balance > 0:
            credit_applied = round(min(balance, merchandise), 2)
            merchandise = round(merchandise - credit_applied, 2)

    shipping = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_FLAT
    state = state_from_zip(body.zip or "")
    tax_rate = STATE_RATES.get(state, 0.0) if state else 0.0
    tax = round(tax_rate * max(merchandise, 0), 2)
    total = round(merchandise + shipping + tax, 2)
    if total < 0.5:
        raise HTTPException(status_code=400, detail="Order total too low for card payment")

    order_id = str(uuid.uuid4())
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/payment/cancel"
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=total, currency="usd", success_url=success_url, cancel_url=cancel_url,
        metadata={"order_id": order_id},
    ))

    order = {
        "id": order_id, "session_id": session.session_id,
        "user_id": user["id"] if user else None,
        "email": user["email"] if user else None,
        "items": line_items,
        "subtotal": subtotal, "kit_savings": kit_savings,
        "promo_code": promo["code"] if promo else None,
        "promo_type": promo["type"] if promo else None,
        "promo_discount": promo_discount,
        "referral_owner_id": promo.get("owner_user_id") if promo and promo["type"] == "referral" else None,
        "credit_applied": credit_applied,
        "shipping": shipping, "tax": tax, "tax_state": state, "tax_rate": tax_rate,
        "total": total, "currency": "usd",
        "status": "Pending", "payment_status": "pending",
        "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat(),
    }
    await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "order_id": order_id,
        "user_id": user["id"] if user else None,
        "amount": total, "currency": "usd",
        "status": "initiated", "payment_status": "pending",
        "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.session_id, "total": total}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
            status = await stripe_checkout.get_checkout_status(session_id)
            if status.payment_status == "paid":
                await mark_order_paid(session_id)
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as e:
            logger.warning(f"Stripe status check failed: {e}")
    return {"session_id": record["session_id"], "status": record["status"], "payment_status": record["payment_status"]}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        if webhook_response.payment_status == "paid":
            await mark_order_paid(webhook_response.session_id)
    except Exception as e:
        logger.warning(f"Webhook handling failed: {e}")
    return {"status": "ok"}


# ---------------- Orders ----------------

ORDER_STATUSES = ("Pending", "Processing", "Shipped", "Delivered", "Cancelled")


@api_router.get("/orders/my")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"], "payment_status": "paid"}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/admin/orders")
async def admin_orders(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    query = {"payment_status": "paid"}
    if status and status in ORDER_STATUSES:
        query["status"] = status
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


class OrderStatusBody(BaseModel):
    status: str


@api_router.patch("/admin/orders/{order_id}")
async def update_order_status(order_id: str, body: OrderStatusBody, admin: dict = Depends(require_admin)):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": body.status, "updated_at": utcnow().isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    revenue = round(sum(o.get("total", 0) for o in orders), 2)
    tax_collected = round(sum(o.get("tax", 0) for o in orders), 2)
    customers = await db.users.count_documents({"role": "user"})
    low_stock = await db.products.find({"stock": {"$lt": 10}}, {"_id": 0}).sort("stock", 1).to_list(20)
    product_count = await db.products.count_documents({})
    newsletter_count = await db.newsletter.count_documents({})
    referral_count = await db.referral_uses.count_documents({})

    monthly = {}
    groups = {}
    for o in orders:
        month = str(o.get("created_at", ""))[:7]
        if month:
            monthly[month] = round(monthly.get(month, 0) + o.get("total", 0), 2)
        for item in o.get("items", []):
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0, "group": 1})
            grp = product["group"] if product else "other"
            groups[grp] = groups.get(grp, 0) + item.get("quantity", 1)

    return {
        "revenue": revenue, "tax_collected": tax_collected,
        "orders": len(orders), "customers": customers, "products": product_count,
        "newsletter": newsletter_count, "referrals": referral_count,
        "low_stock": low_stock,
        "monthly_sales": [{"month": m, "revenue": monthly[m]} for m in sorted(monthly)],
        "group_sales": [{"group": g, "units": groups[g]} for g in groups],
    }


# ---------------- Startup ----------------

SEED_VERSION = 3


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        code = await new_referral_code()
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "PET CLIFF Admin", "email": admin_email,
            "password_hash": hash_password(admin_password), "role": "admin",
            "referral_code": code, "credit_balance": 0.0,
            "created_at": utcnow().isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


async def seed_products():
    marker = await db.settings.find_one({"id": "seed"})
    if marker and marker.get("version") == SEED_VERSION:
        return
    await db.products.delete_many({})
    for p in SEED_PRODUCTS:
        doc = dict(p)
        doc["id"] = str(uuid.uuid4())
        await db.products.insert_one(doc)
    await db.settings.update_one({"id": "seed"}, {"$set": {"version": SEED_VERSION}}, upsert=True)


async def seed_promos():
    if not await db.promo_codes.find_one({"code": "WELCOME10"}):
        await db.promo_codes.insert_one({
            "code": "WELCOME10", "type": "percent", "value": 10.0,
            "owner_user_id": None, "active": True, "uses": 0, "created_at": utcnow().isoformat(),
        })


async def backfill_users():
    async for user in db.users.find({"referral_code": {"$exists": False}}):
        code = await new_referral_code()
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code, "credit_balance": 0.0}})
        await db.promo_codes.insert_one({
            "code": code, "type": "referral", "value": REFERRAL_AMOUNT,
            "owner_user_id": user["id"], "active": True, "uses": 0, "created_at": utcnow().isoformat(),
        })


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_products()
    await seed_promos()
    await backfill_users()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@api_router.get("/")
async def root():
    return {"message": "PET CLIFF API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
