# Cogna Platform Architecture & Engineering Specification

**Document Version**: 1.0.0  
**Status**: Authoritative Reference  
**Last Updated**: October 2026  
**System Classification**: Production AI Subscription & Digital Services Marketplace  

---

## 1. System Overview & Product Direction

Cogna is an enterprise-grade, API-first digital services and AI-subscription marketplace built to deliver automated VTU-style service fulfillment, immutable double-entry wallet accounting, and developer integrations.

### Key Architectural Pillars
- **Unified Identity**: A person holds a single authenticated account providing customer portal access, with optional developer capabilities activated within the same session.
- **Strict Role-Based Access Control (RBAC)**: Distinct operational administrative hierarchy (`SUPER_ADMIN`, `OPERATIONS`, `FINANCE`, `SUPPORT`) segregated from customer and developer access.
- **Financial Ledger Integrity**: Immutable wallet transaction ledger, strict debit locking, idempotency keys for all gateway/provider operations, and zero balance mutation outside verified accounting transactions.
- **Multi-Gateway Payment Orchestration**: Support for Paystack (NGN cards/transfers), Monnify (NGN reserved accounts), and Plisio (USDT TRC20/BEP20 crypto invoices) with verified raw webhook signatures and dynamic fee models.
- **Reseller Provider Integration**: Resilient BullMQ queue workers dispatching fulfillment tasks to upstream API providers (Akunding, Veroxan) with encrypted credentials at rest.

---

## 2. Feature Inventory & Domain Capabilities

| Domain | Key Capabilities | Primary Tech Stack |
| :--- | :--- | :--- |
| **Authentication & Profile** | JWT auth, bcrypt passwords & 6-digit transaction PINs, single-use verification OTPs, profile settings, notification preferences | Fastify, `@fastify/jwt`, bcryptjs |
| **Financial Ledger & Wallet** | NGN wallet funding (fiat & crypto), locked exchange rates, atomic purchase debiting, compensating refunds, admin maker-checker balance adjustments | Prisma, SQLite / PostgreSQL, Decimal |
| **Catalog & Products** | Dynamic category hierarchies, product variants, price locks, automated provider routing, rich search | Prisma, Fastify, Zod |
| **Order Processing & Fulfillment** | Order state machine (`PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED` / `CANCELLED`), BullMQ Redis queue, background polling, delivery item storage | BullMQ, Redis, Fastify |
| **Payment Gateways** | Dynamic gateway configuration, AES-256-GCM secret key encryption, raw HMAC webhook validation, Plisio rate locks | Node.js `crypto`, Axios |
| **Customer Portal** | Real-time balance dashboard, order timeline tracking, printable HTML/PDF receipts, support ticket messaging | Next.js 14, React, Tailwind CSS |
| **Developer Ecosystem** | Scoped API keys (`X-API-Key`), developer webhooks with automatic retries, interactive OpenAPI / Swagger documentation | `@fastify/swagger`, Fastify Hooks |
| **Administrative Operations** | Catalog management, provider credential rotation, finance reconciliation, maker-checker adjustment approvals, audit logging | Fastify Admin RBAC Plugin |

---

## 3. Platform Milestones & Program Status

- **Phase 0 (Core Foundations & Route Recovery)**: COMPLETE — Unified data models, dynamic catalog migration, removal of hardcoded production mocks, and payment adapter abstractions.
- **Phase 1 (Financial Correctness & Ledger Security)**: COMPLETE — Immutable ledger models, idempotency keys, verified webhooks, and transaction PIN enforcement.
- **Phase 2 (Automated Fulfillment & Reseller Workers)**: COMPLETE — BullMQ worker infrastructure, provider credential encryption, and retry orchestration.
- **Phase 3 (Customer Experience & Portal Features)**: COMPLETE — VTU-style wallet dashboard, order history, printable receipts, and support ticketing.
- **Phase 4 (Security Audit & Quality Hardening)**: IN PROGRESS — Full-scope threat modeling, automated security test suite, multi-tenant IDOR verification, and remediation catalog.

---

## 4. Interface Contracts & API Specifications

### Core API Contracts
- **Base URL**: `/api/v1`
- **Authentication Headers**:
  - Customer / Admin JWT: `Authorization: Bearer <jwt_token>`
  - Developer API Key: `X-API-Key: <cogna_live_...>`
- **Response Format Standard**:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Optional human-readable feedback"
  }
  ```
- **Error Response Standard**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Error description",
      "errors": [{ "field": "email", "message": "Invalid email" }]
    }
  }
  ```

### Critical Endpoints
- `POST /api/v1/auth/register` — Account registration with initial transaction PIN
- `POST /api/v1/auth/login` — JWT credential validation and session creation
- `POST /api/v1/wallet/fund` — Fiat wallet funding intent initialization
- `POST /api/v1/wallet/fund/crypto` — Plisio USDT funding intent initialization
- `POST /api/v1/wallet/purchase` — Atomic wallet balance purchase debit
- `POST /api/v1/payments/webhook/:gateway` — Inbound payment gateway webhook handler
- `GET /api/v1/customer/orders/:id` — Owned order lookup with delivery credentials
- `GET /api/v1/customer/receipts/:reference` — Owned financial receipt lookup

---

## 5. Code Layout & Repository Architecture

```
cogna/
├── cogna-backend/                   # Core Backend REST API & Background Workers
│   ├── prisma/
│   │   ├── schema.prisma           # Authoritative database models & relations
│   │   ├── migrations/             # Production database schema migrations
│   │   └── seed.ts                 # Seed fixtures for catalog and roles
│   ├── src/
│   │   ├── config/                 # Environment variables, database, Redis clients
│   │   ├── payments/               # Payment gateway adapters (Paystack, Monnify, Plisio)
│   │   ├── plugins/                # Fastify plugins (admin-rbac, api-key-auth)
│   │   ├── providers/              # Upstream reseller API adapters (Akunding, Veroxan)
│   │   ├── queue/                  # BullMQ worker queue definitions & consumers
│   │   ├── repositories/           # Database access layer encapsulating Prisma queries
│   │   ├── routes/                 # Fastify HTTP route handlers
│   │   ├── services/               # Core business logic & orchestration layer
│   │   ├── utils/                  # Cryptographic utilities, error types, formatting
│   │   ├── validators/             # Zod input validation schemas
│   │   ├── app.ts                  # Fastify application bootstrapping & middleware
│   │   └── server.ts               # HTTP server entrypoint
│   └── tests/                      # Automated Vitest test suite
│       ├── fixtures/               # Test data factories
│       ├── integration/            # API route integration tests
│       ├── security/               # Dedicated programmatic security test suite
│       │   ├── helpers/            # Security test signing & concurrency helpers
│       │   ├── auth-rbac.security.test.ts
│       │   ├── wallet-concurrency.security.test.ts
│       │   ├── webhook-integrity.security.test.ts
│       │   ├── data-isolation-idor.security.test.ts
│       │   └── provider-secrets.security.test.ts
│       └── unit/                   # Isolated service & repository unit tests
├── cogna-frontend/                  # Customer & Admin Web Applications
│   ├── src/
│   │   ├── app/                    # Next.js 14 App Router routes & layouts
│   │   ├── components/             # Reusable UI components (Modals, Forms, Tables)
│   │   ├── lib/                    # HTTP client, formatters, and utilities
│   │   ├── stores/                 # Zustand state stores (auth, cart, wallet)
│   │   └── types/                  # TypeScript interface contracts
├── docs/                           # Authoritative platform documentation
│   ├── COGNA_LAUNCH_PLAN.md        # Product launch roadmap and sprint breakdowns
│   └── SECURITY_AUDIT_REPORT.md    # Full-scope forensic security audit report
└── PROJECT.md                      # Platform architecture & engineering specification
```
