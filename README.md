# OceanLens

OceanLens is a SaaS prototype for tracking ocean freight by Bill of Lading (BL) using forwarder and vessel tracking providers.

This repository contains a Next.js + TypeScript scaffold with:

- NextAuth + Prisma (PostgreSQL) for authentication
- Provider management with encrypted credentials
- A BL search orchestration API (stubbed)
- Mapbox map view for live vessel visualization
- Redis support intended (add configuration)

Quick start:

1. Copy `.env.example` to `.env` and fill values (Postgres, NEXTAUTH_SECRET, MAPBOX_TOKEN)
2. Install dependencies: `pnpm install` or `npm install`
3. Run Prisma migrations: `npx prisma migrate dev --name init`
4. Run dev server: `npm run dev`

This scaffold implements the core architecture; further work is needed to integrate each provider API, implement full auth flows, background syncs, and production deployment tuning.
