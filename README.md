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
