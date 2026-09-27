-- Pet Cliff schema (corrected). Money stored as integer cents.

CREATE TABLE products (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  compare_at_cents INTEGER,
  image_url TEXT,
  description TEXT,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_value TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, option_name, option_value)
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                     -- null for guest customers
  first_name TEXT,
  last_name TEXT,
  referral_code TEXT UNIQUE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE saved_addresses (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  address JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_addresses_customer ON saved_addresses(customer_id);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','fulfilled','cancelled','refunded')),
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  shipping_address JSONB NOT NULL,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders(customer_id);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  UNIQUE (order_id, product_id, variant_id)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE kits (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','applied','abandoned')),
  item_count INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 20,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kits_customer ON kits(customer_id);

CREATE TABLE kit_items (
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  kit_slot TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  PRIMARY KEY (kit_id, kit_slot)
);

CREATE TABLE promotion_codes (
  code TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('percent','fixed','referral')),
  value INTEGER NOT NULL,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_customer_id UUID NOT NULL REFERENCES customers(id),
  referred_email TEXT,
  code TEXT NOT NULL REFERENCES promotion_codes(code),
  reward_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reward_status IN ('pending','earned','paid','void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_customer_id);

CREATE TABLE tax_rates (
  id UUID PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT 'US',
  state_code TEXT,
  postal_prefix TEXT,
  rate NUMERIC(7,5) NOT NULL,
  source TEXT NOT NULL DEFAULT 'native_platform',
  effective_from DATE NOT NULL
);

CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  mode TEXT NOT NULL DEFAULT 'guest' CHECK (mode IN ('guest','account')),
  payment_provider TEXT,
  stripe_session_id TEXT,
  postal_code TEXT,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','completed','expired','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
