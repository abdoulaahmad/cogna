export interface OrderPdfData {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  deliveryItems: string[];
  product: { name: string; description?: string | null };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function buildOrderPdfHtml(order: OrderPdfData): string {
  const money = new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: order.currency, minimumFractionDigits: 2,
  }).format(Number(order.amount));
  const instructions = order.product.description?.trim();
  const itemsHtml = order.deliveryItems.map((item) => {
    const escaped = escapeHtml(item);
    return /^https?:\/\//i.test(item)
      ? `<p style="overflow-wrap: anywhere;"><a href="${escaped}" target="_blank" rel="noopener noreferrer" style="color: #087a5c;">${escaped}</a></p>`
      : `<pre style="white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px; background: #f4f4f4; border-radius: 4px;">${escaped}</pre>`;
  }).join('');
  return `<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #111;">
    <header style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #062C23; margin-bottom: 5px;">Cogna Order Receipt</h1>
      <p>Order ID: ${escapeHtml(order.id)}<br>Date: ${escapeHtml(new Date(order.createdAt).toLocaleString())}</p>
    </header>
    <section style="margin-bottom: 24px; border-bottom: 1px solid #ccc; padding-bottom: 16px;">
      <h2>${escapeHtml(order.product.name)}</h2>
      <p style="font-size: 16px; font-weight: bold;">Amount: ${escapeHtml(money)}</p>
    </section>
    <section style="margin-bottom: 24px;">
      <h2 style="color: #062C23; break-after: avoid;">Delivery details</h2>
      ${itemsHtml}
    </section>
    <section>
      <h2 style="color: #062C23; break-after: avoid;">Description &amp; setup instructions</h2>
      <div style="white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8;">${instructions ? escapeHtml(instructions) : 'Setup instructions have not been added for this product. Contact support@cogna.store for assistance.'}</div>
    </section>
    <footer style="margin-top: 32px; border-top: 1px solid #ccc; padding-top: 12px; color: #666; font-size: 10px;">
      Thank you for using Cogna. For support, contact support@cogna.store
    </footer>
  </div>`;
}
