# PET CLIFF — Session Handoff / Resume Guide

Live site: **https://www.petcliff.com** (also the CloudFront URL https://d1803asar3gw7y.cloudfront.net)
This document = everything needed to resume on another machine. Secrets are NOT here — see `SECRETS.local.md` (gitignored) or your password manager.

---

## 1. Architecture (all in AWS account 052477895577)

```
Browser ──HTTPS──> CloudFront (frontend)  ──> S3  (React static site)
        ──HTTPS──> CloudFront (API)       ──> Elastic Beanstalk (Spring Boot JAR) ──> RDS PostgreSQL (private)
                                                        │
                                                        └──> S3 (media: product images + videos + logo) via CloudFront
Email: AWS SES (sandbox, prod-access requested).  Domain/DNS: GoDaddy.
```

- **Frontend:** React 18 + Vite + Tailwind. Dir: `frontend/`
- **Backend:** Java 21 + Spring Boot 3.3.4 (Maven). Dir: `backend-java/`  (the old Python `backend/` is UNUSED)
- **DB:** PostgreSQL (RDS). Schema via Flyway migrations in `backend-java/src/main/resources/db/migration/` (V1..V5).

---

## 2. AWS resources (region us-west-2 unless noted)

| Resource | ID / Name |
|---|---|
| AWS account (deploy target) | **052477895577** (org management acct) |
| IAM user | `Gokul` (access key in SECRETS.local.md) |
| Frontend S3 bucket | `petcliff-web-052477895577` (**us-east-1**, private) |
| Frontend CloudFront | `EV4ISVWCJCK7` → `d1803asar3gw7y.cloudfront.net` (aliases petcliff.com, www.petcliff.com) |
| Frontend OAC | `E1T0SEJ7CG1DZO` |
| ACM cert (for domain) | `us-east-1` cert for petcliff.com + www (ISSUED) |
| API CloudFront | `E1UB6JHUD03PJV` → `d1ykgcecaqj80i.cloudfront.net` → EB origin (HTTPS) |
| Elastic Beanstalk app | `petcliff` / env `petcliff-prod` |
| EB URL (origin) | `petcliff-prod.eba-hfhx5mpz.us-west-2.elasticbeanstalk.com` (HTTP, locked to CloudFront-only) |
| EB platform / size | Corretto 21 (Java SE), SingleInstance, **t3.micro**, current version **v7** |
| EB deploy bucket | `petcliff-eb-052477895577` |
| EB instance security group | `sg-08e2c169a88476779` (inbound 80 ONLY from CloudFront prefix list `pl-82a045eb`) |
| RDS instance | `petcliff-db` — Postgres 18.3, db.t4g.micro, **private** |
| RDS endpoint | `petcliff-db.cp2o6you4rux.us-west-2.rds.amazonaws.com:5432` db=`petcliff` user=`petcliff` |
| RDS security group | `sg-02d1c4af1e1f41636` (5432 from VPC CIDR 172.31.0.0/16) |
| RDS subnet group | `petcliff-db-subnets` (default VPC `vpc-05be192e1d74b8c5a`) |
| Media S3 bucket | `petcliff-media-052477895577` (private) |
| Media CloudFront | `EMSZIUWRB4WIN` → `dv0xg2r00n59r.cloudfront.net` (OAC `E1SZJA62HB9LNY`) |
| SES | domain identity `petcliff.com` (DKIM pending), sandbox, prod-access requested |
| IAM roles | `aws-elasticbeanstalk-ec2-role` (+ inline `petcliff-media-write` S3 policy), `aws-elasticbeanstalk-service-role` |

**Note on region:** the shell has `AWS_REGION=us-west-2` effectively baked in; backend/RDS/media are us-west-2, frontend S3 + ACM are us-east-1 (CloudFront requires us-east-1 certs). Always pass `--region` explicitly.

---

## 3. Elastic Beanstalk environment variables (set on the env; secrets in SECRETS.local.md)

`DB_URL` = `jdbc:postgresql://petcliff-db.cp2o6you4rux.us-west-2.rds.amazonaws.com:5432/petcliff`
`DB_USER` = `petcliff` · `DB_PASSWORD` = (secret) · `JWT_SECRET` = (secret) · `ADMIN_PASSWORD` = (seed secret; note admin pw was later CHANGED via the UI)
`PORT` = `5000` (EB Java SE proxies to 5000 — REQUIRED) · `CORS_ORIGINS` = `https://www.petcliff.com,https://petcliff.com,https://d1803asar3gw7y.cloudfront.net`
`MEDIA_BUCKET` = `petcliff-media-052477895577` · `MEDIA_CDN` = `dv0xg2r00n59r.cloudfront.net`
`MAIL_FROM` = `noreply@petcliff.com` · `FRONTEND_URL` = `https://www.petcliff.com`
`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` = **placeholders** (checkout is demo-mode until real keys)
`RATE_LIMIT_PER_MIN` = default 10

---

## 4. App logins

- **Admin:** `admin@petcliff.com` / (password was CHANGED via the UI by the user — see SECRETS.local.md for the original seed which is now INVALID). If lost: use "Forgot password" (needs SES) or reset via a new `ADMIN_PASSWORD` env + delete the admin row so it re-seeds, or reset through the DB.
- **Frontend admin console:** log in on the Account page → Admin link appears (role-guarded). Can create/edit/delete products, upload images (→S3), manage promos, view orders.

---

## 5. External accounts

- **GitHub:** `https://github.com/gokul-2104/petcliff` (private). Push needs a Personal Access Token (classic, `repo` scope) as the git password.
- **GoDaddy:** domain `petcliff.com`. Owner account email `vaishnavi@petcliff.com`; collaborator `gokul.satish@outlook.com`. DNS is managed in GoDaddy.
- **Pexels API key:** used once to source stock product images (in SECRETS.local.md). Not needed at runtime.
- **Stripe:** NOT set up yet — needed for real checkout.

---

## 6. DNS records currently in GoDaddy (petcliff.com)

- `www` CNAME → `d1803asar3gw7y.cloudfront.net` (points site to CloudFront)
- 2 ACM validation CNAMEs (`_2511...`, `_bd8a3...www`) — KEEP (cert renewal)
- 3 SES DKIM CNAMEs (`*._domainkey` → `*.dkim.amazonses.com`) — KEEP
- **PENDING:** apex forwarding `petcliff.com` → `https://www.petcliff.com` (GoDaddy Forwarding) — bare domain won't work until added.

---

## 7. What was DONE this session

- Reconstructed the app from a transcript; rebuilt backend in **Spring Boot** (was FastAPI) against a corrected PostgreSQL schema.
- Deployed full stack to AWS: S3+CloudFront frontend, Elastic Beanstalk backend, RDS Postgres, media S3+CloudFront.
- Domain `www.petcliff.com` live with SSL.
- Design pass (warm monochrome, Hanken Grotesk type, editorial mega-menus, Kit "save $X" delta, shop-the-look carousel, express-checkout cart drawer).
- **Admin console:** product create/edit/delete + S3 image upload + promos + orders.
- **Auth:** JWT login, admin seed, change-password, forgot/reset-password (SES email), rate limiting on auth.
- **Customer dashboard:** profile, referral card, order history with status stepper.
- **Media → S3:** all product images + hero/reel videos + logo migrated off external hosts.
- Catalog: 23 products (dog + cat across all categories).
- Tests: 16 JUnit + 5 Vitest/RTL. Frontend route code-splitting.
- **Security hardening:** backend locked to CloudFront-only (SG prefix list), private RDS/S3+OAC, secrets in env (not git), reset-token no longer logged. Ran a security review (1 medium finding, fixed).

## 8. What is PENDING

1. **Stripe** (blocks real sales): no real keys → checkout creates unpaid pending orders AND collects no shipping address. Fix: add Stripe test keys → wire hosted checkout (collects address+payment+tax).
2. **Apex forwarding** in GoDaddy (petcliff.com → www) — quick.
3. **SES**: DKIM verifying + production-access approval (~24h) before forgot-password emails deliver to arbitrary addresses.
4. Future: real photoshoot media (stock now), real carrier tracking (status-based now), AI assistant in reserved 80×80 zone (Jan 2027).

---

## 9. RESUME ON A NEW MACHINE

**A. Install tools:** git, Node 20, JDK 21+, Maven, AWS CLI.
**B. Get the code:** `git clone https://github.com/gokul-2104/petcliff.git` — **BUT** ensure the latest commits are pushed first (see below). Old backend dir `backend/` is unused.
**C. AWS creds:** `aws configure --profile petcliff` with the IAM access key/secret from SECRETS.local.md, region `us-west-2`.
**D. Run locally:**
  - Backend (embedded Postgres, no Docker): `cd backend-java && mvn -DskipTests exec:java` (runs `DevApplication`, seeds demo data, serves :8080).
  - Frontend: `cd frontend && npm install && npm run dev` (serves :3000, talks to :8080 via `.env`).
**E. Redeploy (with AWS creds):**
  - Backend: `cd backend-java && mvn -q -DskipTests package`, zip `target/petcliff-backend-0.1.0.jar` + a `Procfile` (`web: java -jar petcliff-backend-0.1.0.jar`), `aws s3 cp` to `petcliff-eb-052477895577`, `aws elasticbeanstalk create-application-version` + `update-environment` (region us-west-2, env `petcliff-prod`).
  - Frontend: `npm run build` (uses `.env.production` → API at `d1ykgcecaqj80i.cloudfront.net/api`), `aws s3 sync dist s3://petcliff-web-052477895577/ --delete`, then `aws cloudfront create-invalidation --distribution-id EV4ISVWCJCK7 --paths "/*"`.

**Gotchas:** EB Java SE needs `PORT=5000`. Cert for CloudFront must be in us-east-1. The prod JAR is ~171MB (bundles a dev-only mac Postgres binary — harmless). Local commits must be pushed or the new machine won't have latest code.
