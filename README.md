# EquipRent API

Express + MongoDB API for the EquipRent equipment rental platform.

## Setup

```bash
npm install
cp .env.example .env     # fill in DB_URL and JWT_SECRET
npm run seed             # seed categories and reviews (once)
npm run dev              # http://localhost:5000
```

`GET /health` returns `{ "success": true, "status": "ok" }` for deployment checks.

## Environment

All secrets come from `.env` (see `.env.example`): MongoDB URL, shared JWT secret,
allowed CORS origins, Stripe keys, ImgBB key and optional Resend key. Never commit
real credentials. `JWT_SECRET` must match the client-side value.

## Routes

| Prefix | Purpose |
| ------ | ------- |
| `/api/v1/equipments` | Public reads; owner-only writes (JWT + `verifyOwner`) |
| `/api/v1/owner/*` | Owner rentals, profile, revenue, scoped data and analytics |
| `/api/v1/customer/*` | Customer favorites and bookings (`verifyRenter`) |
| `/api/v1/admin/*` | User, equipment and rental management (`verifyAdmin`) |
| `/api/v1/profile` | Shared account profile (any signed-in user) |
| `/api/v1/payments` | Stripe checkout, webhook and payment lookup |
| `/api/v1/uploads` | ImgBB image upload |
| `/api/v1/categories`, `/api/v1/reviews` | Public home content |

Authentication uses `verifyToken`, `verifyRenter`, `verifyOwner` and `verifyAdmin`
in `src/middleware/auth.ts`. The Next.js app signs short-lived HS256 tokens from
better-auth sessions; the API verifies them with the same `JWT_SECRET`.

## Production notes

- Set `CORS_ORIGINS` to the deployed client URL (comma-separated if several).
- Set `CLIENT_URL` so Stripe can redirect back after checkout.
- Register `POST /api/v1/payments/webhook` in Stripe with `STRIPE_WEBHOOK_SECRET`.
- Run `npm run build && npm start` to serve compiled JavaScript from `dist/`.
