# ERP System - Architecture Guide for AI Agents

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Zustand + TanStack Query
- **Backend:** NestJS + Prisma ORM + PostgreSQL
- **Auth:** JWT (Passport) + RBAC
- **Language:** TypeScript (strict)
- **Monorepo:** pnpm workspaces + Turborepo

## Project Structure
```
erp-system/
  apps/
    web/          # Next.js frontend (RTL Arabic UI)
    api/          # NestJS backend (REST + Swagger)
  packages/
    database/     # Prisma schema + service
    shared-types/ # Shared TypeScript types
    shared-utils/ # Shared utilities
```

## Key Conventions
1. **All strings in UI**: Arabic (RTL) - `dir="rtl"` at html tag
2. **Backend modules**: NestJS feature modules in `apps/api/src/modules/`
3. **Database**: PostgreSQL via Prisma ORM in `packages/database/prisma/schema.prisma`
4. **Auth**: JWT tokens, `@UseGuards(JwtAuthGuard)` for protected routes
5. **Permissions**: `@Permissions('module.action')` decorator
6. **API responses**: Always wrapped in `{ success: true, data: ... }`

## How to Run
```bash
pnpm install
pnpm db:generate
pnpm db:push      # Push schema to DB
pnpm db:seed      # Seed COA + admin user
pnpm dev           # Start web (port 3000) + api (port 3001)
```

## Testing Guidelines
- **Frontend**: Use `@testing-library/react` + Vitest
- **Backend**: Use Jest + `@nestjs/testing` + Supertest for e2e
- **Run**: `pnpm --filter @erp/web test` or `pnpm --filter @erp/api test`

## Common Commands
- `pnpm dev` - Start all apps in parallel
- `pnpm build` - Build all apps
- `pnpm db:migrate` - Create Prisma migration
- `pnpm db:studio` - Open Prisma Studio (DB GUI)

## Database
- Connection: `postgresql://postgres:postgres@localhost:5432/erp_system`
- Run `docker compose -f docker/docker-compose.yml up -d` to start PostgreSQL
- Main models: Company, Branch, User, Account, JournalEntry, Voucher, BankAccount, Item, Warehouse
