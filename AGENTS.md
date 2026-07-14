# Cogna Agent Instructions

## Product direction

Cogna is a production AI-subscription and digital-services marketplace, not a limited MVP.

- A person has one account. Customer features are always available.
- Developer access is an enabled capability within that authenticated user portal; never create a separate developer login.
- Admin is a distinct, elevated operations portal with strict RBAC and separate navigation.
- The customer portal follows a VTU-style model: wallet funding, balance, immutable ledger, product purchase, receipts, order tracking, and support.

## Delivery priorities

1. Make all public and authenticated navigation truthful: no broken links, fake screens, or production mock fallbacks.
2. Build financial correctness before wallet UI polish: ledger, idempotency, verified webhooks, atomic transitions, auditability.
3. Keep frontend, backend, Prisma schema, OpenAPI, and tests aligned for each feature.
4. Ship vertical slices: schema, validator, repository, service, route, frontend client/UI, tests, docs, and verification.

## Architecture rules

- TypeScript strict mode; avoid `any`.
- Routes validate input and delegate business logic to services.
- Services access the database only through repositories.
- Use transactions for orders, payments, wallet credits/debits, refunds, and state changes.
- Do not mutate wallet balances directly; create immutable ledger entries.
- Use idempotency keys and unique external references for every gateway/provider write.
- Verify raw webhook signatures before processing and redact credentials from logs/responses.
- Provider and gateway credentials are secrets; encrypt stored provider secrets and never expose them.
- Do not show mock data or silently substitute it after API errors in production UI.
- Use real catalog data; do not hard-code product, category, price, or availability content.

## Access control

- Customer routes require authentication and resource ownership.
- Developer portal routes require authenticated users with the developer capability.
- Public developer API routes use scoped API keys, never portal JWTs.
- Admin routes require an elevated admin role and record audit events for sensitive actions.

## Environments and deployment

- Keep local, sandbox/staging, and production data/credentials separate.
- Wallet funding, provider fulfillment, and API sandbox testing must not use production credentials by default.
- Keep backend CORS restricted to configured frontend origins.
- Use Prisma migrations for production schema changes; do not use `db push` as the production migration strategy.

## Quality gates

- Add/adjust unit and integration tests with every behavior change.
- Run relevant tests, type-check, lint, and build before handoff.
- Update OpenAPI and product documentation when API behavior changes.
- Preserve unrelated user work and do not reset or delete data without explicit authorization.

## Current program

Follow `docs/COGNA_LAUNCH_PLAN.md`.

Begin with Phase 0: route recovery, dynamic catalog, removal of mock production data, contract alignment, and core order/payment/fulfillment correctness. Do not implement wallet funding UI before the wallet ledger and verified payment state machine are designed and tested.
