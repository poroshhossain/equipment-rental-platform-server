# EquipRent API

Express + MongoDB API for the EquipRent equipment rental platform.

## Setup

```bash
npm install
cp .env.example .env     # fill in DB_URL
npm run dev              # http://localhost:5000
```

`GET /health` returns `{ "success": true, "status": "ok" }` for deployment checks.

## Environment

All secrets come from `.env` (see `.env.example`): MongoDB URL and allowed CORS
origins. Never commit real values.

## Routes

| Prefix | Purpose |
| ------ | ------- |
| `/api/v1/equipments` | Equipment reads and writes |
| `/api/v1/owner/*` | Owner rentals, profile, revenue, scoped data and analytics |
| `/api/v1/customer/*` | Customer favorites and bookings |
| `/api/v1/admin/*` | User, equipment and rental management |
| `/api/v1/profile` | Shared account profile |
| `/api/v1/categories`, `/api/v1/reviews` | Public home content |
| `/api/v1/payment/*` | Stripe Checkout, verification, status and webhook |

Authentication and route protection are handled in the Next.js app with
better-auth sessions and client-side role guards. API authorization middleware is
intentionally not included in this project version.

## Stripe

This project is the **only** place Stripe is used. Set `STRIPE_SECRET_KEY` in
the environment to enable Checkout and register
`POST /api/v1/payment/webhook` in the Stripe dashboard (or forward events with
`stripe listen`). The webhook requires the raw request body, which is why
`app.ts` mounts `express.raw()` on that route before `express.json()`.

## Production / Vercel notes

- Set `DB_URL`, `CLIENT_URL` (deployed frontend), `CORS_ORIGINS`,
  `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the Vercel project settings.
  The local `.env` is not deployed.
- `vercel.json` uses Vercel's zero-config Express support; `src/app.ts`
  default-exports the app. `src/server.ts` is only the local `app.listen()`
  entry used by `npm start`.
- No top-level `await`: controllers obtain a lazy `Db` handle from
  `config/db.ts`, so builds and `/health` do not depend on a live MongoDB
  connection.
- Locally run `npm run build && npm start` to serve compiled JavaScript from
  `dist/`.
