import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderPdfHtml } from '../src/lib/order-pdf.ts';

const order = {
  id: 'order-test', createdAt: '2026-11-10T12:00:00Z', amount: '5000', currency: 'NGN',
  product: { name: 'Example subscription', description: '1. Open the service website.\n2. Sign in with your delivery details.\n\nContact support if activation fails.' },
  deliveryItems: ['user@example.com\nExample password', 'https://example.com/activate?key=sample&plan=monthly'],
};

test('includes setup steps with line breaks alongside order and delivery details', () => {
  const html = buildOrderPdfHtml(order);
  assert.ok(html.includes('Description &amp; setup instructions'));
  assert.ok(html.includes(order.product.description));
  assert.ok(html.includes('white-space: pre-wrap'));
  assert.ok(html.includes(order.id));
  assert.ok(html.includes(order.product.name));
  assert.ok(html.includes('Example password'));
  assert.ok(html.includes('href="https://example.com/activate?key=sample&amp;plan=monthly"'));
});

test('treats product instructions and delivery details as text, without HTML injection', () => {
  const html = buildOrderPdfHtml({ ...order,
    product: { name: '<script>alert(1)</script>', description: '<img src=x onerror=alert(1)>' },
    deliveryItems: ['https://example.com/" onclick="alert(1)', '<script>bad()</script>'],
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('href="https://example.com/&quot; onclick=&quot;alert(1)"'));
});

test('does not invent setup instructions when the description is missing', () => {
  for (const description of [null, undefined, '   ']) {
    const html = buildOrderPdfHtml({ ...order, product: { name: 'Example', description } });
    assert.ok(html.includes('Setup instructions have not been added'));
    assert.ok(html.includes('support@cogna.store'));
    assert.ok(!html.includes('undefined'));
  }
});

test('retains the full content of long multiline instructions', () => {
  const description = Array.from({ length: 100 }, (_, i) => `${i + 1}. Complete setup step ${i + 1}.`).join('\n');
  assert.ok(buildOrderPdfHtml({ ...order, product: { name: 'Example', description } }).includes(description));
});
