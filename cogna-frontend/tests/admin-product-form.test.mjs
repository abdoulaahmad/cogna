import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateProductName } from '../src/lib/admin-product-form.ts';

test('typing a new product name keeps generating the full slug', () => {
  let form = { name: '', slug: '', price: '5000' };
  for (const name of ['C', 'Ch', 'Chat', 'ChatGPT', 'ChatGPT Plus']) {
    form = updateProductName(form, name, false);
  }
  assert.equal(form.slug, 'chatgpt-plus');
  assert.equal(form.price, '5000');
  assert.equal(updateProductName(form, 'ChatGPT Plus!', false).slug, 'chatgpt-plus');
});

test('manual slugs and existing product URLs survive name changes', () => {
  assert.equal(updateProductName({ name: 'ChatGPT', slug: 'custom-plan' }, 'ChatGPT Plus', false).slug, 'custom-plan');
  assert.equal(updateProductName({ name: 'ChatGPT', slug: 'chatgpt' }, 'ChatGPT Plus', true).slug, 'chatgpt');
});

test('clearing a generated name and typing again restarts slug generation', () => {
  const cleared = updateProductName({ name: 'ChatGPT', slug: 'chatgpt' }, '', false);
  assert.equal(updateProductName(cleared, 'Claude Pro', false).slug, 'claude-pro');
});
