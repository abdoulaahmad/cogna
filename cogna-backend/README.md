# Cogna Backend

> API-first AI Subscription Marketplace — REST API built with Fastify + TypeScript + Prisma

![CI](https://github.com/yourusername/cogna-backend/actions/workflows/ci.yml/badge.svg)

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript (strict)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Testing**: Vitest + Supertest
- **Payments**: Paystack + Monnify (per-product gateway)
- **Docs**: Swagger UI at `/docs`

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis

### Setup

```bash
# 1. Clone and install
git clone https://github.com/yourusername/cogna-backend
cd cogna-backend
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your values

# 3. Set up database
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

### API Docs

Visit `http://localhost:4000/docs` for interactive Swagger documentation.

## Development Methodology

This project uses **Rapid TDD** — every feature is built test-first:

```
Write test (failing) → Implement → Confirm pass → Refactor
```

## Running Tests

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

## Project Structure

```
src/
├── config/       # env, db, redis
├── routes/       # Fastify route definitions
├── services/     # Business logic
├── repositories/ # Prisma DB layer
├── payments/     # Paystack + Monnify adapters
├── providers/    # Akunding + future provider adapters
├── validators/   # Zod schemas
├── utils/        # Helpers, errors, responses
└── types/        # TypeScript interfaces

tests/
├── unit/         # Service/util tests
├── integration/  # Route/DB tests
└── fixtures/     # Test factories
```

## License

MIT
