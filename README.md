<div align="center">
  <img src="https://cogna.store/favicon.ico" alt="Cogna Logo" width="80" height="80">
  <h1 align="center">Cogna Platform</h1>
  <p align="center">
    <strong>The Premier API-first AI Subscription & Digital Services Marketplace</strong>
  </p>
  <p align="center">
    <a href="https://github.com/abdoulaahmad/cogna/actions/workflows/ci.yml">
      <img src="https://github.com/abdoulaahmad/cogna/actions/workflows/ci.yml/badge.svg" alt="Build Status">
    </a>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white" alt="Fastify">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL">
  </p>
</div>

---

## 🌟 Overview

Cogna is a production-grade digital VTU (Virtual Top-Up) and digital-services marketplace. It allows customers to buy, manage, and resell premium AI subscriptions (like ChatGPT Plus, Claude Pro, Cursor, Gemini Pro) and other digital goods. 

Built with an **API-first architecture**, Cogna serves as both a consumer-facing storefront and a developer platform.

### Core Capabilities
* **💳 Wallet & Immutable Ledger**: A highly secure, transactional wallet system tracking every credit and debit via an immutable ledger.
* **💱 Multi-currency Funding**: Support for fiat deposits (Paystack, Monnify) and instant cryptocurrency funding (USDT BEP-20 via Plisio) with real-time webhooks.
* **🧑‍💻 Developer Portal**: API key generation, usage tracking, and automated webhook deliveries for resellers building on top of Cogna.
* **🛒 Automated Fulfillment**: Instant delivery of digital products upon successful wallet deduction.
* **🛡️ RBAC Admin Operations**: Dedicated elevated operations portal for full system control, analytics, and audit logging.

---

## 🏗️ Architecture & Tech Stack

Cogna is structured as a monorepo containing a decoupled frontend client and a high-performance REST API backend.

```text
cogna/
├── cogna-backend/     ← Fastify REST API
├── cogna-frontend/    ← Next.js 14+ App Router Client
└── docs/              ← Architecture & Planning Documentation
```

### Backend (`cogna-backend/`)
- **Core**: Node.js, Fastify, TypeScript (Strict Mode)
- **Database**: PostgreSQL with Prisma ORM
- **Background Jobs**: Redis + BullMQ (Fulfillment & Webhook retries)
- **Payment Gateways**: Paystack, Monnify (Fiat), Plisio (Crypto)
- **Validation**: Zod
- **Testing**: Vitest + Supertest

### Frontend (`cogna-frontend/`)
- **Core**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **State Management**: Zustand
- **Data Fetching**: Axios, SWR

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL (v14+)
- Redis (Optional, for queues)

### 1. Backend Setup
```bash
cd cogna-backend

# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# 3. Initialize database
npx prisma migrate dev

# 4. Start the development server
npm run dev
```
> The API will be available at `http://localhost:4000`

### 2. Frontend Setup
```bash
cd cogna-frontend

# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL to http://localhost:4000/api/v1

# 3. Start the application
npm run dev
```
> The web app will be available at `http://localhost:3000`

---

## 🔐 API Reference

The Cogna API is fully documented and structured around vertical domains. Base URL: `https://api.cogna.store/api/v1`

| Domain | Description | Example Endpoints |
|--------|-------------|-------------------|
| **Auth** | JWT-based authentication | `POST /auth/login`, `GET /auth/me` |
| **Wallet** | Balances, ledger, fiat/crypto funding | `GET /wallet`, `POST /wallet/fund/crypto` |
| **Products** | Catalog and inventory | `GET /products`, `GET /categories` |
| **Orders** | Purchases and order tracking | `POST /orders`, `GET /orders/:id` |
| **Developer** | API keys and Webhook management | `POST /developer/api-keys`, `GET /developer/webhooks` |
| **Admin** | System configuration and analytics | `GET /admin/dashboard`, `POST /admin/users/:id/suspend` |

---

## 🛠️ Development Methodology

Cogna follows strict production-grade development standards:
1. **Vertical Slicing**: Features are shipped completely (Schema → Repository → Service → Route → Frontend).
2. **Transactional Integrity**: Financial operations (orders, payments, wallet logic) are wrapped in strict Prisma transactions.
3. **Idempotency**: External gateway integrations and webhooks use idempotency keys to prevent double-charging.

Please refer to `AGENTS.md` and `CLAUDE.md` for our complete engineering rules and automated agent guidelines.

---

## 📄 License

MIT — © 2026 Abdullahi A. Ahmad
