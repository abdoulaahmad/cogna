# Checkout payment confirmation and recovery

Checkout creates an order and a pending payment before the gateway collects funds. Pending alone does not mean the customer has paid. Only server verification of the gateway result, amount and currency confirms payment.

## Corrected failure paths

The saved Heroku logs contain the queue error `Custom Id cannot contain` at `heroku-logs.txt:37` and `heroku-logs2.txt:437`. This corroborates the invalid fulfillment job ID in the gateway payment path. It does not establish the status of an individual customer's charge without their payment reference.

- Keep the cart until confirmed payment. Closing or failing the Paystack window retains the initialized order/payment in the mounted checkout page so retry resumes the same attempt.
- The return page checks `GET /api/v1/payments/verify/:reference` sequentially, up to 12 times at five-second intervals, and offers a manual check. Network errors are distinct from gateway-declared failure. Cleanup cancels polling, including React Strict Mode effect replay.
- BullMQ disallows colons in custom job IDs. Gateway fulfillment now uses `fulfill_<orderId>`, matching wallet fulfillment, instead of the rejected `fulfill:<orderId>`.
- A paid payment whose order is still pending can retry dispatch using the same job ID. This recovers the case where payment was persisted before Redis failed. Orders already processing or complete are not redispatched by this recovery path.
- Signed duplicate webhooks retry verification/dispatch. An event receipt does not imply successful processing.
- Payment transitions compare against PENDING inside a database transaction so a stale callback cannot overwrite a terminal result.

## Supporting an existing pending order

Use the customer's order payment reference to open `/verify?reference=<reference>` while signed in as the owner. This verifies with the gateway and retries interrupted dispatch for paid/pending orders. Do not ask the customer to pay again until the original payment is checked. The API, Redis and fulfillment worker must all be running; gateway credentials and signed webhook configuration must match the original environment.

This fix requires no schema changes. Existing orders are not automatically changed by deploying this code; customers can use the verification link to recover eligible payments. Browser reloads do not preserve the in-memory checkout attempt; an ambiguous initialization response still requires checking the existing order before a new attempt.

## Verification

Backend payment repository/service, queue recovery, signed webhook retry and HTTP route tests cover the repair. Frontend `npm test` covers delayed success, bounded pending checks, temporary/persistent errors, terminal states, and cancellation/restart.

Verified locally: 295 backend tests and seven frontend tests pass; both TypeScript checks and backend build pass. Frontend production build passes with `npm run build -- --webpack` because this Windows environment lacks Next.js native SWC bindings for Turbopack. Lint passes for all changed source/test files. Repository-wide lint still reports existing errors in other files. A live gateway transaction was not performed.
