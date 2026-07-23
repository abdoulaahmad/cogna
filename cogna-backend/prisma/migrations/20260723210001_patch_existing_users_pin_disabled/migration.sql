-- Patch: existing accounts have no PIN hash yet.
-- Disable PIN requirement for them so they are not blocked at checkout.
-- They can set a PIN from Security settings at any time.
UPDATE "users"
SET "transaction_pin_enabled" = FALSE
WHERE "transaction_pin_hash" IS NULL;
