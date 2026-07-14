# Cogna Launch Plan

## 1. Purpose and launch definition

Cogna will launch as a production AI-subscription and digital-services marketplace with four connected experiences:

1. Public marketplace: discovery, product detail, trust content, registration, and login.
2. Customer portal: VTU-style wallet, funding, purchases, receipts, order tracking, profile, support, and notifications.
3. Developer workspace: a capability inside an authenticated user account, not a separate login. Users can enable developer access, create API keys, read live API documentation, test against a sandbox, manage webhooks, and inspect usage.
4. Admin operations portal: a separate, role-protected workspace for catalog, provider, payment, wallet, user, risk, support, reporting, audit, and platform settings.

Launch is complete only when a new customer can register, fund a wallet through a configured payment gateway, buy an available product, track the order, receive an auditable outcome, and when an administrator can support and operate that transaction safely.

## 2. Product principles

- One account per person or business. Customer and developer capabilities coexist on the same account.
- Wallet balances are ledger-derived, never edited directly.
- Every payment, wallet movement, order, provider request, webhook, and admin intervention is idempotent and auditable.
- Product availability and prices come from the catalog API; no production storefront content is hard-coded.
- Gateway and provider secrets are encrypted at rest, never returned by APIs, and never committed.
- Sandbox and production use separate credentials, endpoints, data, and API keys.
- No mock data or silent fallback data is shown in production screens.

## 3. Information architecture and routes

### Public website

- `/` Home
- `/catalog` Catalog with search, filter, sorting, pagination, and featured products
- `/products/[slug]` Product detail, delivery rules, price, availability, and purchase CTA
- `/pricing`, `/about`, `/faq`, `/contact`
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- `/terms`, `/privacy`, `/refund-policy`
- `/docs` Public API landing page that links to live Swagger and developer onboarding

### Authenticated user portal

- `/dashboard` Account overview: wallet balance, pending/completed orders, recent activity, quick funding/purchase actions
- `/wallet` Wallet balance, funding, transaction history, payment methods, receipts
- `/wallet/fund` Gateway selection and funding checkout
- `/orders` Order history
- `/orders/[id]` Order timeline, payment, provider/delivery details, invoice/receipt, support action
- `/products/[slug]` purchase flow available to logged-in customers
- `/profile`, `/settings`, `/security`, `/notifications`, `/support`
- `/developer` Developer overview; visible when developer capability is enabled
- `/developer/keys`, `/developer/docs`, `/developer/sandbox`, `/developer/webhooks`, `/developer/usage`, `/developer/orders`

### Admin portal

- `/admin` Operational dashboard
- `/admin/users`, `/admin/customers`, `/admin/developers`
- `/admin/wallets`, `/admin/wallet-transactions`, `/admin/funding`
- `/admin/orders`, `/admin/payments`, `/admin/refunds`
- `/admin/products`, `/admin/categories`, `/admin/providers`, `/admin/gateways`
- `/admin/webhooks`, `/admin/api-logs`, `/admin/audit-logs`
- `/admin/analytics`, `/admin/reports`, `/admin/settings`, `/admin/support`

## 4. Role and access model

The current single `UserRole` enum is insufficient because a customer should be able to use developer features without a second account.

Implement:

- `User`: authenticated identity.
- `UserCapability`: `DEVELOPER` and future business capabilities; enabled by the user or admin according to policy.
- `AdminRole`: separate elevated role set, for example `ADMIN`, `OPERATIONS`, `SUPPORT`, `FINANCE`, and `SUPER_ADMIN`.
- Central policy checks on every backend route and frontend navigation guard.
- Customer account remains the default; enabling developer capability grants access to `/developer/*` without changing customer functionality.

## 5. Wallet and VTU-style customer experience

### Wallet requirements

- Show available balance, pending balance, lifetime funded, lifetime spent, and recent transactions.
- Fund via Paystack and Monnify with gateway selection based on availability, limits, and configured environment.
- Use a unique wallet funding reference and idempotency key for every funding attempt.
- Credit the wallet only after verified gateway confirmation or validated webhook; never from client redirects alone.
- Support pending, completed, failed, reversed, refunded, and manually adjusted transactions.
- Generate downloadable receipts and display a timeline for every wallet transaction.
- Allow product purchases from wallet. Product checkout reserves/debits balance atomically and creates an order in one transaction.
- Provide clear insufficient-funds flow that routes the user to wallet funding.

### New data model

Add at minimum:

- `Wallet`: one per user, cached available/pending balance plus timestamps.
- `WalletTransaction`: immutable ledger entry with type, direction, amount, balance-before/after, status, reference, idempotency key, source, metadata, and actor.
- `WalletFunding`: gateway intent/verification record linked to wallet transaction and payment reference.
- `Refund`: linked to payment/order/wallet transaction with reason, status, initiator, and approval data.
- `PaymentEvent`: deduplicated provider/webhook event store for forensic replay.

Use decimal currency amounts consistently. Define one canonical internal unit before implementation; avoid mixing naira and kobo.

## 6. Catalog, purchase, fulfillment, and support

### Catalog

- Replace static homepage subscriptions and categories with backend responses.
- Add category, feature, active, price, availability, provider, and gateway metadata deliberately exposed to clients.
- Add public product detail endpoint by slug and admin product lifecycle controls: draft, active, paused, archived.
- Add stock/availability and delivery rules where provider supports them.

### Purchase lifecycle

1. Customer selects product.
2. Backend validates product availability and customer eligibility.
3. Customer pays from wallet, or is sent through gateway funding flow.
4. Backend creates payment/wallet/order records atomically and idempotently.
5. Verified payment queues fulfillment.
6. Provider adapter receives product/provider configuration.
7. Order status progresses `PENDING → PAID → PROCESSING → COMPLETED` or `FAILED/CANCELLED/REFUNDED`.
8. Customer sees status, delivery details, receipt, and support options.

### Fulfillment repairs

- Resolve provider by `providerId`, not provider name.
- Encrypt provider credentials.
- Persist normalized provider request/response summaries and redacted diagnostics.
- Implement provider polling or provider webhook processing to close `PROCESSING` orders.
- Add retry, dead-letter, manual retry, cancellation, and alerting behavior.

## 7. Payment architecture

- Keep Paystack and Monnify behind a shared gateway contract.
- Separate wallet funding, direct checkout, refunds, verification, and webhook processing.
- Verify amount, currency, reference, recipient/user, and expected state before applying any credit or fulfillment.
- Preserve pending gateway states; never convert all non-success responses to `FAILED`.
- Verify raw webhook payload signatures before parsing business events.
- Store gateway account configuration securely and support per-product gateway assignment.
- Add payment history for customers and payment/reconciliation operations for admins.
- Configure sandbox credentials first; production credentials, webhook URLs, and callback URLs only after full test signoff.

## 8. Developer workspace and API platform

### User experience

- Developer onboarding inside `/developer`; no separate developer login.
- API key list/create/revoke/rotate with key shown exactly once.
- Key scopes, environment (`test` or `live`), optional IP allowlists, expiry, and last-used data.
- Live API docs generated from OpenAPI/Swagger.
- Interactive sandbox console that sends requests only to `/api/v1/sandbox` or a separately deployed sandbox environment.
- Webhook endpoint registration, secret generation/rotation, delivery logs, replay, and signature documentation.
- Usage dashboard: requests, failures, latency, rate-limit usage, orders, and wallet/purchase events relevant to the developer.

### Backend requirements

- Implement API-key authentication middleware for developer-consumed endpoints, separate from JWT portal management endpoints.
- Add scoped API key validation, rate limiting per key, API request logs, and idempotency keys for write endpoints.
- Implement documented developer usage and webhook endpoints.
- Add a stable OpenAPI description for every public/developer/admin endpoint.
- Provide sandbox catalog/order/payment simulation that cannot trigger real gateway charges or provider fulfillment.

## 9. Admin operations portal

### Required modules

- Dashboard: GMV, wallet liabilities, gateway success rate, orders by state, provider health, fraud/risk flags, support backlog.
- Users: search, profile review, status control, developer capability management, session/API key review.
- Wallets: ledger search, funding verification, guarded manual adjustments with maker-checker approval, reconciliation exports.
- Orders: filters, order detail, provider retry, cancellation/refund initiation, customer communication history.
- Payments: gateway references, event timeline, reconciliation, refunds, failed-payment investigation.
- Catalog/providers: CRUD, secrets management, product mapping, gateway assignment, synchronization, pause/unpause.
- Governance: audit logs, API logs, role administration, platform settings, incident notes.

Every high-risk admin action must record actor, reason, before/after data, IP address, timestamp, and approval where appropriate.

## 10. Frontend remediation plan

### Route recovery first

Create or remove all currently broken links:

- Build `/catalog`, `/products/[slug]`, `/docs`, `/terms`, `/privacy`, `/forgot-password`.
- Replace placeholder anchor links with real sections or remove them.
- Add `not-found.tsx`, error boundaries, loading states, and consistent empty states.
- Centralize route constants so navigation cannot point to absent pages.

### Data integration

- Create typed frontend API services for auth, catalog, wallet, orders, payments, developer, and admin modules.
- Remove static product/category arrays and mock order fallback data.
- Align all frontend types with backend response contracts.
- Return relation-enriched order views from backend or map them through dedicated view models.
- Commit and deploy the payment verification route correction.

### UX and security

- Implement authenticated portal layout with capability-aware navigation.
- Keep admin layout separate and role protected.
- Call backend logout before clearing local state.
- Avoid storing sensitive data beyond required tokens; use secure cookie strategy in the production hardening phase.
- Add accessible forms, validation, clear gateway/pending states, and responsive mobile wallet flows.

## 11. Backend and database remediation plan

### Correct current defects

- Align payment verification endpoint contract between client, docs, and backend.
- Enforce order ownership during payment initialization and verification.
- Make payment and wallet transitions transactional and idempotent.
- Return populated order data needed by customer UI.
- Fix provider lookup by ID and worker completion/failure persistence.
- Remove `any` usage in authentication decoration and standardize error handling.
- Replace plaintext provider credentials and seeded production-like secrets.
- Remove unsafe `NODE_TLS_REJECT_UNAUTHORIZED = '0'` from seed/runtime behavior.

### Schema and migration discipline

- Create Prisma migrations; stop relying on `db push` for production evolution.
- Add wallet, ledger, funding, refund, webhook, API log, notification, support, role/capability, and idempotency entities.
- Add indexes and unique constraints for every external reference and idempotency key.
- Use append-only financial ledger records; never delete financial history.
- Separate seed fixtures from production bootstrap, with no default production passwords.

## 12. Testing and quality gates

### Automated tests

- Unit tests for services, gateway/provider adapters, wallet accounting, authorization, and state transitions.
- Integration tests for every route, RBAC rule, payment webhook, order lifecycle, and idempotency behavior.
- End-to-end browser tests for registration, login, wallet funding sandbox, wallet purchase, order tracking, developer key generation, and admin catalog edits.
- Contract tests that ensure OpenAPI, backend routes, and frontend service clients agree.
- Security tests for webhooks, access boundaries, rate limits, secret redaction, and invalid state transitions.

### Release gates

- No broken internal links or unresolved 404 pages.
- Backend type-check, lint, tests, and migration validation pass.
- Frontend build, lint, and end-to-end smoke suite pass.
- Sandbox gateway and provider flows pass before production credentials are enabled.
- Backup/restore, incident response, monitoring, and rollback runbooks are documented.

## 13. Infrastructure and environments

- Maintain `local`, `staging/sandbox`, and `production` environments.
- Use Neon for managed PostgreSQL with pooled runtime URL and a controlled migration connection strategy.
- Keep Redis available for BullMQ workers and configure the worker as a separately deployed process.
- Deploy frontend separately (Vercel or equivalent) and set backend CORS to the exact frontend origins per environment.
- Use a managed secret store/config vars for all credentials.
- Configure error tracking, structured logs, uptime checks, database backups, queue monitoring, and alerting.
- Add CI for type-check, lint, unit/integration tests, build, migration validation, and deployment promotion.

## 14. Delivery phases

### Phase 0 — Stabilize the current platform

- Fix every broken route/link and commit existing frontend verification fix.
- Replace mock/static production data paths.
- Align documented API contracts to implementation or implement the documented contract.
- Fix current order relation, payment state, provider ID, and ownership defects.
- Remove unsafe seeded credentials and prepare migrations.

### Phase 1 — Public marketplace and customer foundation

- Public catalog, product detail, legal/support content.
- Account verification, password recovery, profile, account security.
- Customer dashboard, order detail/timeline, receipts, notifications.

### Phase 2 — Wallet and payments

- Wallet/ledger schema and API.
- Paystack and Monnify sandbox funding.
- Verified webhook processing, balance credit, wallet purchase, reconciliation, refunds.
- Admin wallet/payment operations.

### Phase 3 — Reliable provider fulfillment

- Provider credential encryption and configuration.
- Correct provider adapter resolution, queue operations, retries, polling/webhooks, support tooling.
- End-to-end sandbox-to-provider test and fulfillment monitoring.

### Phase 4 — Developer platform

- Unified developer capability onboarding.
- Scoped test/live API keys, Swagger/OpenAPI, sandbox console, usage, webhooks, logs, developer order API.

### Phase 5 — Full admin and launch operations

- Admin dashboard, users, orders, payments, wallets, refunds, analytics, audit logs, settings, support.
- Monitoring, security review, load testing, backup/restore drills, production gateway/provider credentials.

### Phase 6 — Launch readiness

- Staging acceptance test with real-like sandbox integrations.
- Security/access audit and legal/policy review.
- Production deployment, CORS/domain configuration, operational runbook, soft launch, monitored rollout.

## 15. Immediate next implementation sequence

1. Route recovery and navigation audit.
2. Dynamic catalog plus real product detail/cart flow.
3. Customer dashboard and relation-correct order API.
4. Wallet schema/ledger before any balance feature UI.
5. Sandbox funding and wallet purchase flow.
6. Fulfillment reliability fixes.
7. Developer workspace and sandbox API.
8. Admin operations modules.

This order keeps financial correctness, operational control, and customer trust ahead of cosmetic expansion.
