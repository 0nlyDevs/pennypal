<div align="center">
  <h1 style="margin-bottom: 0.25rem;">Expense Tracker – Server</h1>
  <p style="margin-top: 0; color: #6b7280;">Express API powering the Expense Tracker.</p>
  <p>
    <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
    <img alt="Node" src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-pg-336791?logo=postgresql&logoColor=white" />
  </p>
  <p>
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-2C3E50?logo=prisma&logoColor=white" />
    <img alt="Helmet" src="https://img.shields.io/badge/Security-helmet-000000" />
    <img alt="OpenAPI" src="https://img.shields.io/badge/OpenAPI-3.0-6BA539?logo=openapiinitiative&logoColor=white" />
  </p>
</div>

<h2>Tech Stack</h2>

- Node.js 18+
- Express 4
- PostgreSQL (via `pg`)
- Helmet, CORS, Morgan

## Key Capabilities

- 🔐 JWT-based auth with protected routes and middleware guards.
- 🧾 Expense receipts handling (multipart upload) and static serving via `/uploads/`.
- 💾 PostgreSQL via Prisma with migrations, seeding, and `prisma studio`.
- 📈 Summaries and alerts endpoints for dashboards (monthly and range-based).
- 🧰 Validation via `express-validator` and structured errors via `HttpError`.
- 🔒 Security hardening with `helmet` and CORS configuration.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation & Run](#installation--run)
- [Environment](#environment)
- [Architecture Diagram](#architecture-diagram)
- [API Base URL](#api-base-url)
- [Routes Overview](#routes-overview)
- [Database & Prisma](#database--prisma)
- [OpenAPI Spec & Client Generation](#openapi-spec--client-generation)
- [Security & Middlewares](#security--middlewares)

<h2>Requirements</h2>

- Node.js >= 18
- npm or yarn

<h2>Installation & Run</h2>

1) Install dependencies

```bash
npm install
```

2) Configure environment

```bash
cp .env.example .env
```

Then edit `.env` with your actual configuration values.

3) Start the server

```bash
# Full pre-start setup (database + generated API client)
npm run build

# Development (auto-reload)
npm run dev

# Production
npm start
```

Default base URL:

- If `PORT` is set (recommended `8080`), API is at `http://localhost:PORT` (e.g., `http://localhost:8080`).
- If `PORT` is not set, `server.js` falls back to `4000` → `http://localhost:4000`.

Note: the frontend SDK (`client/src/api/core/OpenAPI.ts`) points to `http://localhost:8080/api` by default. Set `PORT=8080` in `server/.env` to match, or adjust the client config.

<h2>Environment</h2>

Key variables in `server/.env`:

- `PORT` – server port (default: 8080)
- `DATABASE_URL` – Postgres connection string
- `JWT_SECRET` – secret for JWT signing
- `CORS_ORIGIN` – allowed frontend origin (e.g., http://localhost:5173)

Additional variables (see `.env.example`):

- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL` — Vercel Postgres support.
- `FRONTEND_URL` — used for redirects (OAuth), falls back to `CORS_ORIGIN`.
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_OAUTH_TIMEOUT_MS`.
- Supabase (for receipts storage): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_RECEIPTS`.

<h2>Architecture Diagram</h2>

```mermaid
flowchart TD
  client[Client Web] --> api[Express Server]

  subgraph Server
    api --> mw[Middlewares]
    api --> routes[Routes api]
    routes --> auth[auth]
    routes --> user[user]
    routes --> expenses[expenses]
    routes --> incomes[incomes]
    routes --> categories[categories]
    routes --> summary[summary]
    routes --> reports[reports]
    api --> uploads[Static uploads]
    api --> prisma[(Prisma Client)]
    api -.-> supabase[(Supabase Storage)]
  end

  prisma --> pg[(PostgreSQL)]
```

<h2>API Base URL</h2>

- Base: `http://localhost:8080/api`
- Health checks:
  - `GET /api/health` — server status OK
  - `GET /api/db-check` — database connectivity check

<h2>Routes Overview</h2>

Mounted in `server/server.js`:

- 🔐 `POST /api/auth/*` — authentication (signup, login, logout, me, OAuth callback)
- 👤 `GET /api/user/*` — user profile; `PATCH /api/user/profile`; password update (protected)
- 🧾 `GET|POST|PUT|DELETE /api/expenses/*` — expenses CRUD (+ file upload for receipts)
- 💸 `GET|POST|PUT|DELETE /api/incomes/*` — incomes CRUD (protected)
- 🗂️ `GET|POST|PUT|DELETE /api/categories/*` — categories CRUD
- 📊 `GET /api/summary/*` — summaries and budget alerts (protected)
- 🗄️ `GET /uploads/*` — static receipts served from `uploads/`

<h2>Database & Prisma</h2>

- Prisma commands:

```bash
# full pre-start build setup
npm run build

# generate client
npm run prisma:generate

# dev migrations
npm run prisma:migrate

# apply migrations (prod)
npm run prisma:deploy

# seed data
npm run prisma:seed

# inspect data
npm run prisma:studio
```

`npm run build` runs Prisma generate, applies deploy migrations, and regenerates the client SDK from the OpenAPI spec.

<h2>Notes</h2>

- Logging via `morgan` (dev-friendly).
- Security headers via `helmet`.
- CORS configured via `CORS_ORIGIN`.

<h2>OpenAPI Spec & Client Generation</h2>

- Spec location: `server/docs/Expense Tracker API.yaml`
- To regenerate the client SDK after spec changes:

```bash
cd ../client
npm run api:generate
```

<h2>Security & Middlewares</h2>

- `helmet` for secure headers (CSP disabled in dev for DX).
- `cors` configured with `CORS_ORIGIN`, `credentials: true`.
- `cookie-parser` for reading cookies (e.g., session/JWT if applicable).
- `requireAuth` middleware guards protected routes (`/api/incomes`, `/api/user`, `/api/summary`).

<h2>cURL Examples</h2>

Auth (signup/login):

```bash
# signup
curl -X POST http://localhost:8080/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Password123!"}'

# login
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Password123!"}'
```

Expenses (with receipt upload):

```bash
curl -X POST http://localhost:8080/api/expenses \
  -H 'Authorization: Bearer <JWT>' \
  -F amount=19.99 -F date=2025-09-12 -F categoryId=1 \
  -F description='Coffee' -F type=one-time \
  -F receipt=@/path/to/receipt.jpg
```

Incomes:

```bash
curl -X POST http://localhost:8080/api/incomes \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1200,"date":"2025-09-01","source":"Salary"}'
```

Categories:

```bash
curl -X POST http://localhost:8080/api/categories \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Books"}'
```

Summary:

```bash
curl -X GET 'http://localhost:8080/api/summary?start=2025-09-01&end=2025-09-30' \
  -H 'Authorization: Bearer <JWT>'
```

<h2>Seed Data</h2>

The seed script (`prisma/seed.js`) inserts global expense categories (e.g., Rent, Groceries, Travel) with `user_id = null`. Run:

```bash
npm run prisma:seed
```

Note: no default users are created by the seed; sign up via the auth endpoint.

<h2>Docker for Postgres (optional)</h2>

`docker-compose.yml` snippet for local DB:

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: expenses
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Set in `server/.env`:

```
DATABASE_URL=postgres://dev:dev@localhost:5432/expenses
```

<h2>Error Model & Status Codes</h2>

Errors extend `HttpError` (`server/utils/errors.js`) and are serialized by the global error handler as:

```json
{
  "error": "Message",
  "details": { }
}
```

Common status codes:

- 400 Bad Request — validation errors
- 401 Unauthorized — missing/invalid token
- 403 Forbidden — insufficient permissions
- 404 Not Found — resource not found
- 409 Conflict — duplicates, invariant violations
- 500 Internal Server Error — unhandled errors

## Troubleshooting

- ❌ CORS blocked
  - Ensure `CORS_ORIGIN` matches your frontend (e.g., `http://localhost:5173`). Restart the server after changes.

- 🔗 Client can’t reach API
  - Client SDK default base is `http://localhost:8080/api`. Set `PORT=8080` in `server/.env` or override the client base.

- 🗄️ DB connection fails
  - Verify `DATABASE_URL` (or Vercel Postgres variables). Test with `npm run prisma:deploy` and `npm run prisma:studio`.

- 🧾 Upload returns 4xx/5xx
  - Check multipart form field names (`receipt`), file size limits, and that `/uploads` directory is writable in your environment.

- 🔑 OAuth callback mismatch
  - Ensure `GOOGLE_REDIRECT_URI` exactly matches the configured URL in Google Console (dev/prod differ).
