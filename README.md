# ApplyDiary

ApplyDiary is a full-stack job application tracker with a React frontend and Express API.

## Project Structure

- `apps/web`: React + Vite client
- `apps/api`: Express + TypeScript API

## Quick Start (One Command)

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Start everything (Postgres + API + Web)

```bash
npm run dev
```

This command:
- starts PostgreSQL via Docker Compose
- applies Prisma migrations
- runs API and web dev servers together

## Manual Start (Alternative)

```bash
npm run db:up
npm --workspace apps/api run prisma:deploy
npm run dev:api
npm run dev:web
```

To stop the database container:

```bash
npm run db:down
```

## Current Scope

This initial scaffold includes:
- JWT auth (`/auth/register`, `/auth/login`)
- Auth-protected application CRUD (`/applications`)
- Inline edit/delete actions in the applications table
- Per-application note CRUD (`/applications/:id/notes`)
- Status filtering, search, and sorting
- PostgreSQL persistence via Prisma ORM

## Deployment (Vercel + Render + Neon)

This stack is a fast, resume-friendly production setup:

1. Create a Postgres DB on Neon and copy the connection string.
2. Deploy API on Render:
   - Build command: `npm install && npm --workspace apps/api run build`
   - Start command: `npm --workspace apps/api run start`
   - Environment:
     - `DATABASE_URL` = Neon connection string
     - `JWT_SECRET` = strong random string
     - `JWT_EXPIRES_IN` = `7d`
     - `CLIENT_ORIGIN` = your Vercel URL (ex: `https://applydiary.vercel.app`)
3. Deploy Web on Vercel:
   - Root directory: `apps/web`
   - Environment:
     - `VITE_API_URL` = your Render API URL (ex: `https://applydiary-api.onrender.com`)

After deploy:
- hit `https://<render-api>/health`
- open Vercel app and register
