import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError } from 'axios';
import { getErrorMessage } from '../src/lib/error-message.ts';

function responseError(data) {
  const error = new AxiosError('Request failed with status code 400');
  error.response = { data, status: 400 };
  return error;
}

test('displays field-level API validation errors', () => {
  const error = responseError({ message: 'Validation failed', errors: [
    { field: 'slug', message: 'Too small: expected string to have >=2 characters' },
    { field: 'price', message: 'Too small: expected number to be >0' },
  ] });
  assert.equal(getErrorMessage(error, 'Unable to save'), 'Validation failed: slug: Too small: expected string to have >=2 characters; price: Too small: expected number to be >0');
});

test('ignores malformed error details and retains network and ordinary error messages', () => {
  assert.equal(getErrorMessage(responseError({ message: 'Validation failed', errors: [null, 1, { message: {} }] }), 'Fallback'), 'Validation failed');
  assert.equal(getErrorMessage(new AxiosError('Network Error'), 'Fallback'), 'Network Error');
  assert.equal(getErrorMessage(new Error('Save failed'), 'Fallback'), 'Save failed');
  assert.equal(getErrorMessage(null, 'Fallback'), 'Fallback');
});
