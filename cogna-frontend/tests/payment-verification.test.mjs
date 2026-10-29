import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pollPaymentVerification } from '../src/lib/payment-verification.ts';

const payment = (status) => ({ status, orderId: 'order-1' });
function options(overrides = {}) {
  return { signal: new AbortController().signal, intervalMs: 1, attempts: 3,
    onResult: () => {}, onError: () => assert.fail('Unexpected verification error'), ...overrides };
}

test('checks delayed confirmation until paid, then stops', async () => {
  const results = [];
  const statuses = ['PENDING', 'PENDING', 'PAID'];
  await pollPaymentVerification(options({
    verify: async () => payment(statuses.shift()), onResult: (value) => results.push(value.status),
  }));
  assert.deepEqual(results, ['PENDING', 'PENDING', 'PAID']);
});

test('keeps an unconfirmed payment pending after the bounded polling window', async () => {
  const results = [];
  await pollPaymentVerification(options({
    verify: async () => payment('PENDING'), onResult: (value) => results.push(value.status),
  }));
  assert.deepEqual(results, ['PENDING', 'PENDING', 'PENDING']);
});

test('a temporary network failure is retried without declaring payment failed', async () => {
  let calls = 0;
  const results = [];
  await pollPaymentVerification(options({
    verify: async () => { if (++calls === 1) throw new Error('Network error'); return payment('PAID'); },
    onResult: (value) => results.push(value.status),
  }));
  assert.equal(calls, 2);
  assert.deepEqual(results, ['PAID']);
});

test('persistent network failures report an error after bounded retries', async () => {
  let calls = 0;
  let failures = 0;
  await pollPaymentVerification(options({
    verify: async () => { calls++; throw new Error('Offline'); },
    onError: () => failures++,
  }));
  assert.equal(calls, 3);
  assert.equal(failures, 1);
});

test('terminal failed and refunded payments stop immediately', async () => {
  for (const status of ['FAILED', 'REFUNDED']) {
    let calls = 0;
    await pollPaymentVerification(options({ verify: async () => { calls++; return payment(status); } }));
    assert.equal(calls, 1);
  }
});

test('cleanup ignores an in-flight response and allows a fresh effect run', async () => {
  const controller = new AbortController();
  let finish;
  const first = pollPaymentVerification(options({
    signal: controller.signal, verify: () => new Promise((resolve) => { finish = resolve; }),
    onResult: () => assert.fail('Aborted effect updated state'),
  }));
  controller.abort();
  finish(payment('PAID'));
  await first;
  let confirmed = false;
  await pollPaymentVerification(options({ verify: async () => payment('PAID'), onResult: () => { confirmed = true; } }));
  assert.equal(confirmed, true);
});

test('cleanup cancels the waiting timer without sending another request', async () => {
  const controller = new AbortController();
  let calls = 0;
  const checking = pollPaymentVerification(options({
    signal: controller.signal, intervalMs: 60000,
    verify: async () => { calls++; return payment('PENDING'); },
  }));
  await new Promise((resolve) => setTimeout(resolve, 1));
  controller.abort();
  await checking;
  assert.equal(calls, 1);
});
