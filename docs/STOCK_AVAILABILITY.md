# Automatic stock availability

When provider stock is zero, negative, missing, or cannot be verified, the marketplace, dashboard, featured products, product details/modal and cart show **Unavailable** and disable purchase actions. Only an active product with confirmed finite positive stock and no provider availability restriction is purchasable. Unknown stock stays `null` rather than being misreported as zero. Catalog product responses include `available: boolean`.

Open catalog, dashboard, homepage featured products and product detail pages recheck data once a minute. Provider inventory uses the existing ten-minute cache, so upstream changes are reflected after that cache refreshes, rather than instantly. Checkout reloads the product before starting payment and displays unavailability if the stock has changed since it was added to the cart.

If a product is absent from the provider's bulk list, Cogna checks its individual stock endpoint. This recovers zero-stock products omitted from Akunding's bulk list. Individual results are cached and concurrent lookups are deduplicated. Expired positive stock is not reused after a provider error. Numeric stock strings are normalized, and explicit provider unavailability is respected.

The API checks the same provider inventory before creating orders, initializing gateway payments, or debiting a wallet. Unavailable or unverified stock returns HTTP 409 with `Product is unavailable`. Existing wallet purchase replays return their owned original order even if stock has since reached zero. Payment verification for an already paid order continues normally.

No schema changes or stock reservations are introduced. Provider fulfillment remains the final authority if inventory changes during payment. This work does not deploy automatically.
