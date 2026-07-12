# Cogna

> **API-first AI Subscription Marketplace** — buy, manage, and resell premium AI subscriptions (ChatGPT Plus, Claude Pro, Cursor, Gemini Pro, and more).

![Backend CI](https://github.com/abdoulaahmad/cogna/actions/workflows/ci.yml/badge.svg)

---

## What is Cogna?

Cogna is a full-stack platform that enables:
- **Customers** to purchase AI subscriptions with instant delivery
- **Developers** to access a REST API with API key authentication
- **Businesses** to resell AI subscriptions at scale
- **Admins** to manage the entire platform from a dashboard

---

## Monorepo Structure

```
cogna/
├── cogna-backend/     ← Fastify REST API (Node.js + TypeScript + Prisma)
├── cogna-frontend/    ← Next.js 14 App (TypeScript + Tailwind + shadcn/ui)
└── docs/              ← Product, API, and architecture documentation
```

---

## Tech Stack

### Backend (`cogna-backend/`)
| Layer | Technology |
|-------|-----------|
| Framework | Fastify |
| Language | TypeScript (strict) |
| ORM | Prisma |
| Database | PostgreSQL |
| Queue | Redis + BullMQ |
| Payments | Paystack + Monnify (per-product gateway) |
| Testing | Vitest + Supertest |
| Docs | Swagger UI |

### Frontend (`cogna-frontend/`)
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| HTTP | Axios |

---

## Getting Started

### Backend
```bash
cd cogna-backend
cp .env.example .env     # fill in your values
npm install
npx prisma migrate dev
npm run dev
# API running at http://localhost:4000
# Docs at http://localhost:4000/docs
```

### Frontend
```bash
cd cogna-frontend
cp .env.local.example .env.local
npm install
npm run dev
# App running at http://localhost:3000
```

---

## API Overview

Base URL: `https://api.cogna.store/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me` |
| Products | `/products`, `/products/:id`, `/products/search` |
| Orders | `/orders`, `/orders/:id`, `/orders/:id/export` |
| Payments | `/payments/initialize`, `/payments/verify`, `/payments/webhook/*` |
| Developer | `/developer/api-keys`, `/developer/webhooks`, `/developer/usage` |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/orders`, `/admin/settings` |

---

## Development Methodology

This project uses **Rapid TDD** — every feature is built test-first:
```
Write failing test → Implement → Confirm pass → Refactor → Commit
```

See [CLAUDE.md](./CLAUDE.md) for full agent and developer guidelines.

---

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Agent & developer guidelines, TDD methodology |
| [SRS](./docs/) | Software Requirements Specification |
| [API Spec](./docs/) | REST API Specification |
| [Database Design](./docs/) | Schema & relationships |

---

## License

MIT — © 2026 Abdullahi A. Ahmad
