# Voter

Social polling: **Ask. Vote. Decide.**

Monorepo with a Next.js app (`apps/web`) and a NestJS API (`apps/api`) on PostgreSQL.

## Run locally

1. Copy env files:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

2. Start Postgres (Docker Desktop) **or** point `DATABASE_URL` at a Neon database:

```bash
docker compose up -d
```

This machine does not require Docker if you paste a Neon connection string into `.env` and `apps/api/.env`.

3. Install, migrate, seed:

```bash
npm install
npm run db:migrate
npm run db:seed
```

4. Start both apps:

```bash
npm run dev:api
npm run dev:web
# or single command (Windows/macOS):
npm run dev
```

Web: [http://localhost:3000](http://localhost:3000)  
API: [http://localhost:3001](http://localhost:3001)

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@voter.app` | `Admin123!` |
| User | `rahul@voter.app` | `password123` |
| User | `priya@voter.app` | `password123` |
| User | `amit@voter.app` | `password123` |

Images are stored under `apps/api/uploads` unless S3-compatible env vars are set.

## Deploy (fixes DNS_HOSTNAME_RESOLVED_PRIVATE)

The error `DNS_HOSTNAME_RESOLVED_PRIVATE` / `Server returned non-JSON (404)` on Vercel means the deployed **web** is still trying to proxy `/api` to `http://localhost:3001` — which is private on the edge.

You must deploy the API separately and point the web to it:

1. **Deploy API** to Render / Railway / Fly / etc.:
   - Root: `apps/api`
   - Build: `npm install && npm run build -w api`
   - Start: `npm run start -w api` (or `node apps/api/dist/main`)
   - Env: `DATABASE_URL` (Neon/Supabase), `CORS_ORIGIN=https://<your-web>.vercel.app`, `SESSION_SECRET`, `JWT_SECRET`, `NODE_ENV=production`

2. **Set env on Vercel (web)**:
   - `NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com`
   - `API_URL=https://<your-api>.onrender.com` (used by rewrites)
   - `NEXT_PUBLIC_APP_URL=https://<your-web>.vercel.app`
   - Redeploy after changing env (Vercel bakes `NEXT_PUBLIC_` at build time).

Local dev keeps `NEXT_PUBLIC_API_URL=http://localhost:3001` — no change needed.

`apps/web/next.config.ts` rewrites `/api/v1/*` and `/uploads/*` to `${API_URL || NEXT_PUBLIC_API_URL}/...` — so the web works both locally and in production once the URL is public.
