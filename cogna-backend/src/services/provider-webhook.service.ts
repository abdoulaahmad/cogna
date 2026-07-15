import { createHash, createHmac } from 'crypto';
import { ProviderRepository } from '@/repositories/provider.repository';
import { ProviderWebhookRepository } from '@/repositories/provider-webhook.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { decryptCredential } from '@/utils/credential-crypto';
type ProviderWebhookPayload = Record<string, unknown> & { event_id?: string; id?: string; event_type?: string; type?: string; provider_order_id?: string; order_id?: string; status?: string; data?: { orderId?: string; status?: string } }

import { UnauthorizedError, NotFoundError, ValidationError } from '@/utils/errors';

/**
 * Verifies the signature of incoming webhooks based on provider-specific rules.
 */
export function verifyProviderWebhookSignature(
  provider: { name: string; apiKey: string; apiSecret: string | null },
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>
): boolean {
  // Use the decrypted apiSecret (or fallback to decrypted apiKey as the signing key)
  const secret = (() => {
    try { return provider.apiSecret ? decryptCredential(provider.apiSecret) : decryptCredential(provider.apiKey) }
    catch { return provider.apiSecret || provider.apiKey }
  })();

  if (!secret) return false;

  const getHeader = (key: string): string => {
    const val = headers[key];
    return Array.isArray(val) ? val[0] : val || '';
  };

  if (provider.name.toLowerCase() === 'akunding') {
    // Akunding expects a signature in 'x-akunding-signature' header
    const signature = getHeader('x-akunding-signature');
    if (!signature) return false;

    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    return computed === signature;
  }

  // Generic custom signature header check
  const genericSignature = getHeader('x-provider-signature');
  if (genericSignature) {
    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    return computed === genericSignature;
  }

  // If no signature header is supplied, check for pre-shared static auth token
  const authHeader = getHeader('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    return token === secret;
  }

  return false;
}

export const ProviderWebhookService = {
  /**
   * Processes a webhook request from an external reseller provider.
   */
  async processWebhook(
    providerId: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ) {
    // 1. Resolve Provider
    const provider = await ProviderRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider');
    }

    // 2. Verify Signature
    const isValid = verifyProviderWebhookSignature(provider, rawBody, headers);
    if (!isValid) {
      throw new UnauthorizedError('Invalid provider webhook signature');
    }

    // 3. Compute Hash for Idempotency
    const payloadHash = createHash('sha256').update(rawBody).digest('hex');

    // Parse payload
    let payload: ProviderWebhookPayload;
    try {
      const parsed: unknown = JSON.parse(rawBody.toString('utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ValidationError('Webhook payload must be an object');
      payload = parsed as ProviderWebhookPayload;
    } catch {
      throw new ValidationError('Invalid JSON payload');
    }

    const eventId = payload.event_id || payload.id || payloadHash;
    const eventType = payload.event_type || payload.type || 'order.updated';

    // 4. Check for duplicates
    let webhookEvent = await ProviderWebhookRepository.findByPayloadHash(providerId, payloadHash);
    if (!webhookEvent) {
      webhookEvent = await ProviderWebhookRepository.findByEventId(providerId, eventId);
    }

    if (webhookEvent) {
      if (webhookEvent.status === 'PROCESSED') {
        return {
          success: true,
          message: 'Webhook already processed (idempotent)',
          eventId,
          status: 'PROCESSED',
        };
      }
      // If it exists but is not processed, we will continue processing it
    } else {
      // Create new event record
      webhookEvent = await ProviderWebhookRepository.create({
        providerId,
        eventId,
        payloadHash,
        eventType,
        payload,
      });
    }

    // 5. Lookup corresponding order & update status
    const providerOrderId = payload.provider_order_id || payload.order_id || payload.data?.orderId;
    if (!providerOrderId) {
      await ProviderWebhookRepository.updateStatus(webhookEvent.id, 'FAILED');
      throw new ValidationError('Missing provider order ID in payload');
    }

    const order = await OrderRepository.findByProviderOrderId(providerId, providerOrderId);
    if (!order) {
      await ProviderWebhookRepository.updateStatus(webhookEvent.id, 'FAILED');
      throw new NotFoundError(`Order with provider reference ${providerOrderId}`);
    }

    // 6. Map status
    const rawStatus = (payload.status || payload.data?.status || '').toLowerCase();
    let targetStatus: 'COMPLETED' | 'FAILED' | 'PROCESSING' = 'PROCESSING';
    if (['completed', 'success', 'succeeded'].includes(rawStatus)) {
      targetStatus = 'COMPLETED';
    } else if (['failed', 'error', 'failed_payment'].includes(rawStatus)) {
      targetStatus = 'FAILED';
    }

    // 7. Update order status and raw response diagnostics (redacted)
    await OrderRepository.updateStatus(order.id, targetStatus);

    // Redact sensitive credentials if any exist in payload
    const diagnostics = { ...payload };
    delete diagnostics.apiKey;
    delete diagnostics.secret;
    delete diagnostics.api_key;
    delete diagnostics.api_secret;

    await OrderRepository.setProviderResponse(order.id, diagnostics);

    // 8. Mark Webhook as PROCESSED
    await ProviderWebhookRepository.updateStatus(webhookEvent.id, 'PROCESSED');

    return {
      success: true,
      message: `Order status updated to ${targetStatus}`,
      eventId,
      orderId: order.id,
      status: 'PROCESSED',
    };
  },
};
