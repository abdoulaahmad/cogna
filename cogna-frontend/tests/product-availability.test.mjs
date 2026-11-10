import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isProductAvailable } from '../src/lib/product-availability.ts';

test('zero and negative stock disable purchase regardless of active status', () => {
  assert.equal(isProductAvailable({ active: true, stock: 0 }), false);
  assert.equal(isProductAvailable({ stock: -1 }), false);
});
test('restocked products become available, while manually inactive products remain unavailable', () => {
  assert.equal(isProductAvailable({ active: true, stock: 1 }), true);
  assert.equal(isProductAvailable({ active: false, stock: 10 }), false);
});
test('unknown stock remains distinct from zero and missing products cannot be purchased', () => {
  assert.equal(isProductAvailable({ stock: null }), true);
  assert.equal(isProductAvailable({}), true);
  assert.equal(isProductAvailable(null), false);
});
