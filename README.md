# CareerFlow

CareerFlow is a full-stack job application tracker with a React frontend and Express API.

## Project Structure

- `apps/web`: React + Vite client
- `apps/api`: Express + TypeScript API

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
```

3. Run database migrations (requires a running PostgreSQL instance)

```bash
npm --workspace apps/api run prisma:migrate
```

4. Start the API (http://localhost:4000)

```bash
npm run dev:api
```

5. Start the web app (http://localhost:5173)

```bash
npm run dev:web
```

## Environment

Create `apps/api/.env` from `apps/api/.env.example`.

## Current Scope

This initial scaffold includes:
- JWT auth (`/auth/register`, `/auth/login`)
- Auth-protected application CRUD (`/applications`)
- Status filtering, search, and sorting
- PostgreSQL persistence via Prisma ORM
