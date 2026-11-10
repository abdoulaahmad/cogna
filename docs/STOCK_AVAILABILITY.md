# Automatic stock availability

When provider stock is zero or negative, the marketplace, dashboard, featured products, product details/modal and cart show **Unavailable** and disable purchase actions. An active product with positive stock becomes purchasable again when refreshed; manually inactive products stay unavailable. Unknown stock remains distinct from confirmed zero stock.

Open catalog, dashboard, homepage featured products and product detail pages recheck data once a minute. Provider inventory uses the existing ten-minute cache, so upstream changes are reflected after that cache refreshes, rather than instantly. Checkout reloads the product before starting payment and displays unavailability if the stock has changed since it was added to the cart.

The API checks the same cached provider inventory before creating orders, initializing gateway payments, or debiting a wallet. Zero/negative stock returns HTTP 409 with `Product is unavailable`. Existing wallet purchase replays return their owned original order even if stock has since reached zero. Payment verification for an already paid order continues normally.

No schema changes or stock reservations are introduced. Provider fulfillment remains the final authority if inventory changes during payment. This work does not deploy automatically.
