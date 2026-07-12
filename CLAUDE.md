# CLAUDE.md — Cogna Platform

> Agent instruction file for AI-assisted development on the Cogna API-first AI subscription marketplace.
> All agents working on this codebase must follow these guidelines strictly.

---

## Project Identity

- **Name**: Cogna
- **Type**: API-first AI Subscription Marketplace
- **Owner**: Abdullahi A. Ahmad
- **Version**: 1.0 (MVP)
- **Status**: In Development

---

## Tech Stack (Mandatory — Do Not Deviate)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **HTTP**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Plugins**: @fastify/jwt, @fastify/rate-limit, @fastify/swagger, @fastify/cors

### Database
- **Primary**: PostgreSQL (via Prisma ORM)
- **Queue**: Redis + BullMQ

### Payments (Multi-Gateway)
- Paystack
- Monnify
- Gateway is assigned **per product**, not globally

### Provider/Fulfillment (Per-Product)
- Akunding Store Reseller API (initial)
- Provider credentials stored **in the database** (providers table), not in env
- Each product maps to a specific provider via `provider_id`

### Hosting
- Frontend: Vercel
- Backend: Railway (preferred) or Heroku
- DB: Supabase (PostgreSQL) or Railway Postgres

---

## Development Methodology: Rapid TDD

> Every feature must follow this cycle: **Test ? Implement ? Verify ? Refactor**

### The Rapid TDD Cycle

```
1. WRITE TEST FIRST   ?  Write a failing unit/integration test
2. RUN & CONFIRM FAIL ?  Run the test. It must fail (proves test is real)
3. IMPLEMENT          ?  Write the minimum code to make it pass
4. RUN & CONFIRM PASS ?  Run the test. It must pass
5. REFACTOR           ?  Clean up code without breaking tests
6. REPEAT             ?  Move to next unit
```

### Rules

- **Never commit code without a corresponding test.**
- **Never skip step 2** — a test that never fails is not a real test.
- Tests are written **before** or **alongside** implementation, never after.
- Keep each test focused on **one behavior**.
- Prefer **integration tests** for API routes (test the full request/response cycle).
- Prefer **unit tests** for services, utilities, and transformers.

---

## Backend Project Structure

```
backend/
+-- src/
¦   +-- config/           # env, db, redis config
¦   +-- plugins/          # Fastify plugins (jwt, cors, swagger)
¦   +-- routes/           # Route definitions (thin — no logic)
¦   +-- controllers/      # Request handlers (thin — delegate to services)
¦   +-- services/         # Business logic (all heavy lifting here)
¦   +-- repositories/     # Prisma DB access (one file per model)
¦   +-- providers/        # External API integrations (Akunding, etc.)
¦   +-- payments/         # Payment gateway adapters (paystack.ts, monnify.ts)
¦   +-- jobs/             # BullMQ background jobs
¦   +-- validators/       # Zod request validators
¦   +-- utils/            # Shared helpers
¦   +-- types/            # TypeScript interfaces & enums
¦   +-- app.ts            # Fastify app setup
+-- tests/
¦   +-- unit/             # Pure unit tests (services, utils)
¦   +-- integration/      # Full route/DB tests
¦   +-- fixtures/         # Shared test data & factories
+-- prisma/
¦   +-- schema.prisma
¦   +-- migrations/
+-- .env
+-- .env.test             # Separate DB for test runs
+-- package.json
```

---

## Frontend Project Structure

```
frontend/
+-- app/                  # Next.js App Router pages
¦   +-- (public)/         # Public website routes
¦   +-- (customer)/       # Customer dashboard routes
¦   +-- (developer)/      # Developer portal routes
¦   +-- (admin)/          # Admin dashboard routes
+-- components/
¦   +-- ui/               # shadcn/ui base components
¦   +-- layout/           # Navbar, Sidebar, Footer
¦   +-- product/          # Product cards, filters
¦   +-- order/            # Order tables, status badges
¦   +-- payment/          # Payment forms, gateway selector
¦   +-- dashboard/        # Stat cards, charts
+-- stores/               # Zustand stores
+-- services/             # Axios API calls
+-- hooks/                # Custom React hooks
+-- types/                # TypeScript interfaces
+-- lib/                  # Shared utilities
+-- __tests__/            # Frontend unit/component tests
```

---

## Naming Conventions

| Type             | Convention    | Example                     |
|------------------|---------------|-----------------------------|
| Variables        | camelCase     | `userId`, `orderStatus`     |
| Functions        | camelCase     | `createOrder()`, `getUser()`|
| Classes          | PascalCase    | `OrderService`, `UserRepo`  |
| Interfaces/Types | PascalCase    | `CreateOrderDto`, `UserRole`|
| Enums            | PascalCase    | `OrderStatus`, `PayGateway` |
| Files            | kebab-case    | `order-service.ts`          |
| DB Tables        | snake_case    | `orders`, `api_keys`        |
| DB Columns       | snake_case    | `provider_id`, `paid_at`    |
| API Routes       | kebab-case    | `/api/v1/api-keys`          |
| Test files       | `*.test.ts`   | `order.service.test.ts`     |

---

## API Standards

### Base URL
```
https://api.cogna.store/api/v1
```

### Response Shape

```ts
// Success
{ success: true, message: "Operation successful.", data: {} }

// Error
{ success: false, message: "Validation failed.", errors: [] }
```

### Status Codes

| Code | Meaning               |
|------|-----------------------|
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

---

## Testing Standards

### Tools
- **Backend**: Vitest + Supertest + Prisma test client
- **Frontend**: Vitest + React Testing Library

### Test Database
- Use `.env.test` with a separate test PostgreSQL DB
- Reset DB between suites using `prisma db push --force-reset` or transactions

### Coverage Requirements (Minimum)
- Services: **90%**
- Routes/Controllers: **80%**
- Utils: **100%**
- Frontend components: **70%**

### Test File Placement
```
src/services/order.service.ts       ? tests/unit/order.service.test.ts
src/routes/orders.ts                ? tests/integration/orders.test.ts
components/product/ProductCard.tsx  ? __tests__/components/ProductCard.test.tsx
```

### Test Template

```ts
import { describe, it, expect } from 'vitest'
import { OrderService } from '../../src/services/order.service'

describe('OrderService', () => {
  describe('createOrder', () => {
    it('should return order with PENDING status', async () => {
      // Arrange
      const input = { userId: 'u1', productId: 'p1', amount: 5000 }
      // Act
      const result = await OrderService.createOrder(input)
      // Assert
      expect(result.status).toBe('PENDING')
    })

    it('should throw if product does not exist', async () => {
      await expect(
        OrderService.createOrder({ userId: 'u1', productId: 'invalid', amount: 100 })
      ).rejects.toThrow('Product not found')
    })
  })
})
```

---

## Payment Gateway Architecture

### Adapter Pattern

```
src/payments/
  gateway.interface.ts     # IPaymentGateway interface
  paystack.adapter.ts      # Paystack implementation
  monnify.adapter.ts       # Monnify implementation
  gateway.factory.ts       # resolveGateway(product) ? correct adapter
```

Each product stores `payment_gateway` (`paystack` | `monnify`).
The factory resolves the right adapter at runtime — no if/else chains in business logic.

### Adding a New Gateway
1. Create `<name>.adapter.ts` implementing `IPaymentGateway`
2. Register in `gateway.factory.ts`
3. Add env vars
4. No other files change

---

## Provider/Fulfillment Architecture

### Adapter Pattern

```
src/providers/
  provider.interface.ts     # IProvider interface
  akunding.adapter.ts       # Akunding implementation
  provider.factory.ts       # resolveProvider(product) ? correct adapter
```

Credentials (api_key, base_url, api_config) are stored in the `providers` DB table.
The factory loads credentials at runtime from the DB.

### Adding a New Provider
1. Create `<name>.adapter.ts` implementing `IProvider`
2. Register in `provider.factory.ts`
3. Insert provider row in DB via Admin dashboard
4. No env changes needed

---

## Security Rules

- HTTPS only
- bcrypt password hashing (rounds = 12)
- JWT access tokens: 15min expiry
- Refresh tokens: 7d, stored in DB
- API key auth for Developer routes (`X-API-Key: cg_live_...`)
- RBAC enforced on every protected route
- Rate limiting: 100 req/min (public), 1000 req/hr (developer)
- All inputs validated with Zod before hitting services
- Provider API credentials never logged or exposed in API responses
- Webhook signatures verified for both Paystack and Monnify

---

## Environment Variables

```env
# App
APP_NAME=Cogna
APP_ENV=development
APP_URL=http://localhost:3000
PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cogna
DATABASE_TEST_URL=postgresql://user:pass@localhost:5432/cogna_test

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Payments
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_BASE_URL=https://sandbox.monnify.com

# Provider fallback (actual keys live in DB providers table)
AKUNDING_API_KEY=
AKUNDING_BASE_URL=

# Queue
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

---

## Git Workflow

### Branches
```
main           — production only
develop        — integration branch
feature/<name> — new features
bugfix/<name>  — bug fixes
hotfix/<name>  — urgent prod fixes
test/<name>    — test-only work
```

### Commits (Conventional Commits)
```
feat:     new feature
fix:      bug fix
test:     tests only
refactor: no feature/fix logic change
docs:     documentation
chore:    tooling, deps, config
style:    formatting only
```

### Pre-commit Checklist
- [ ] `npm test` — all tests pass
- [ ] `npm run type-check` — zero TS errors
- [ ] `npm run lint` — clean
- [ ] New code has tests
- [ ] No secrets in code

---

## Development Workflow (Per Feature)

```
1. Update Prisma schema (if DB change)
2. Generate & run migration
3. Write Zod validator
4. Write failing test (unit + integration)
5. Implement repository method
6. Implement service method
7. Implement controller (thin)
8. Register Fastify route
9. Run tests — all pass
10. Swagger docs auto-generated
11. Commit with conventional message
```

---

## Agent-Specific Rules

1. **Always write tests before or with implementation** — never implementation-only.
2. **Never use `any` in TypeScript** — use proper types or `unknown`.
3. **Never put business logic in controllers** — controllers call services only.
4. **Never hardcode payment gateway or provider** — always resolve via factory.
5. **Never skip Zod validation** — every route must validate its input.
6. **Ask before adding new dependencies**.
7. **Run tests after every change** — confirm nothing breaks.
8. **Keep functions small** — over 30 lines is a sign to split.
9. **Always handle errors explicitly** — no silent failures.
10. **All DB queries go through repositories** — never call Prisma directly from services.
11. **Use DB transactions** for order creation and payment operations.
12. **Never expose raw provider responses** to the client — always map to Cogna shapes.

---

## Micro-Commit Strategy (Target: 1000+ commits)

> Every agent session must produce the maximum number of meaningful atomic commits.

### Golden Rule: One Logical Unit = One Commit

Never commit more than ONE of the following at a time:
- One function implementation
- One test case
- One type/interface
- One component
- One route registration
- One bug fix
- One refactor

### Commit Count Target Per Module

Each endpoint must produce **15-20 commits** minimum:

`
types:      add <Entity>Dto interface              ? commit 1
types:      add <Entity>Status enum                ? commit 2
test:       add failing test for Repo.create       ? commit 3
feat:       implement Repo.create                  ? commit 4
test:       add failing test for Repo.findById     ? commit 5
feat:       implement Repo.findById                ? commit 6
test:       add failing test for Service.create    ? commit 7
feat:       implement Service method               ? commit 8
test:       add failing test for Service edge case ? commit 9
feat:       handle edge case in Service            ? commit 10
feat:       add Zod validator for endpoint         ? commit 11
feat:       implement controller handler           ? commit 12
feat:       register route in Fastify              ? commit 13
test:       add integration test - success case    ? commit 14
test:       add integration test - error case      ? commit 15
refactor:   extract helper logic                   ? commit 16
docs:       add JSDoc to service method            ? commit 17
chore:      update CHANGELOG                       ? commit 18
`

### Branch Per Feature (Mandatory)

`ash
git checkout -b feature/<module>-<unit>
# work, commit frequently
git push origin feature/<module>-<unit>
# open PR ? merge ? delete branch
`

### Daily Push Requirement

Push at minimum once per session so contributions register on GitHub.