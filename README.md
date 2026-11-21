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

Authentication and route protection are handled in the Next.js app with
better-auth sessions and client-side role guards. API authorization middleware is
intentionally not included in this project version.

## Production notes

- Set `CORS_ORIGINS` to the deployed client URL (comma-separated if several).
- Run `npm run build && npm start` to serve compiled JavaScript from `dist/`.
