# Admin product validation

A browser console entry for HTTP 400 alone does not identify the rejected field or request method. In the Network tab, inspect the failing `/api/v1/admin/products` request's method, payload and Response. The API returns `{ success: false, message: "Validation failed", errors: [{ field, message }] }` for invalid product input.

The creation form previously generated a slug only while its current slug was empty. Typing `ChatGPT Plus` one character at a time therefore left the slug as `c`, which the API correctly rejects because slugs require at least two characters. The form now keeps automatically generated slugs in sync with the name, preserves manually edited slugs, and preserves existing product URLs during edits. Browser constraints also match the API's minimum name/slug lengths, positive price, and three-character currency requirement.

API errors now include their field-level reasons in the UI. Backend validation and authorization remain enforced. Regression tests cover incremental typing, custom/existing slugs, reset/retyping, structured errors and the API's 400 response for a short slug/zero price.

These local repairs reproduce one cause of a product creation 400; they do not establish the cause of an individual production request without its response body. The read-only GET product listing has no request-body validator. Do not assume creation validation is responsible if the failure happens while opening the page.
