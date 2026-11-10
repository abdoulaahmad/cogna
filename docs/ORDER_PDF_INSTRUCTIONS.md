# Customer setup instructions in order PDFs

In Admin > Products, create or edit a product and fill in **Description & setup instructions**. Write each setup step on its own line. This uses the existing product description field, which is also public on product pages; it must not contain private customer credentials.

The purchased order displays the description under a labeled instructions section beside the delivered content. **Download .pdf** now includes the product, amount, order reference/date, delivered credentials or activation links, and the same instructions. Newlines are preserved; description text is not interpreted as HTML. Existing products/order downloads use their current description automatically. If no instructions are configured, the PDF directs the customer to support without inventing activation steps.

The PDF export reports failures and disables repeated download clicks while it is being generated. No schema change or production deployment is required to implement this local change. Financial receipt printing and plain-text delivery exports retain their existing behavior.
