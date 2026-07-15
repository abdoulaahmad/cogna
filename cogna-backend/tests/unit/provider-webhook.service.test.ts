import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/repositories/provider.repository', () => ({
  ProviderRepository: { findById: vi.fn() },
}));
vi.mock('@/repositories/provider-webhook.repository', () => ({
  ProviderWebhookRepository: {
    findByEventId: vi.fn(),
    findByPayloadHash: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
}));
vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: {
    findByProviderOrderId: vi.fn(),
    updateStatus: vi.fn(),
    setProviderResponse: vi.fn(),
  },
}));
vi.mock('@/utils/credential-crypto', () => ({
  decryptCredential: vi.fn((val) => val), // simple mock returning plaintext
}));

import { ProviderWebhookService } from '@/services/provider-webhook.service';
import { ProviderRepository } from '@/repositories/provider.repository';
import { ProviderWebhookRepository } from '@/repositories/provider-webhook.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { createHmac } from 'crypto';

describe('ProviderWebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects webhooks with invalid signatures', async () => {
    vi.mocked(ProviderRepository.findById).mockResolvedValueOnce({
      id: 'provider-1',
      name: 'Akunding',
      slug: 'akunding',
      apiKey: 'key',
      apiSecret: 'secret',
      status: 'ACTIVE',
      baseUrl: 'http://akunding.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const body = Buffer.from(JSON.stringify({ event_id: 'evt-1' }));
    const headers = { 'x-akunding-signature': 'invalid-sig' };

    await expect(
      ProviderWebhookService.processWebhook('provider-1', body, headers)
    ).rejects.toThrow('Invalid provider webhook signature');
  });

  it('processes webhook and updates order status successfully', async () => {
    vi.mocked(ProviderRepository.findById).mockResolvedValueOnce({
      id: 'provider-1',
      name: 'Akunding',
      slug: 'akunding',
      apiKey: 'key',
      apiSecret: 'secret',
      status: 'ACTIVE',
      baseUrl: 'http://akunding.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const payload = {
      event_id: 'evt-123',
      provider_order_id: 'po-456',
      status: 'completed',
    };
    const body = Buffer.from(JSON.stringify(payload));
    const signature = createHmac('sha256', 'secret').update(body).digest('hex');
    const headers = { 'x-akunding-signature': signature };

    vi.mocked(ProviderWebhookRepository.findByPayloadHash).mockResolvedValueOnce(null);
    vi.mocked(ProviderWebhookRepository.findByEventId).mockResolvedValueOnce(null);
    vi.mocked(ProviderWebhookRepository.create).mockResolvedValueOnce({ id: 'wh-1' } as unknown);
    vi.mocked(OrderRepository.findByProviderOrderId).mockResolvedValueOnce({ id: 'order-789' } as unknown);

    const result = await ProviderWebhookService.processWebhook('provider-1', body, headers);

    expect(result.success).toBe(true);
    expect(result.status).toBe('PROCESSED');
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-789', 'COMPLETED');
    expect(ProviderWebhookRepository.updateStatus).toHaveBeenCalledWith('wh-1', 'PROCESSED');
  });

  it('handles duplicate webhooks idempotently', async () => {
    vi.mocked(ProviderRepository.findById).mockResolvedValueOnce({
      id: 'provider-1',
      name: 'Akunding',
      slug: 'akunding',
      apiKey: 'key',
      apiSecret: 'secret',
      status: 'ACTIVE',
      baseUrl: 'http://akunding.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const payload = {
      event_id: 'evt-123',
      provider_order_id: 'po-456',
      status: 'completed',
    };
    const body = Buffer.from(JSON.stringify(payload));
    const signature = createHmac('sha256', 'secret').update(body).digest('hex');
    const headers = { 'x-akunding-signature': signature };

    // Mock existing processed event
    vi.mocked(ProviderWebhookRepository.findByPayloadHash).mockResolvedValueOnce({
      id: 'wh-1',
      status: 'PROCESSED',
    } as unknown);

    const result = await ProviderWebhookService.processWebhook('provider-1', body, headers);

    expect(result.success).toBe(true);
    expect(result.message).toContain('already processed');
    expect(OrderRepository.updateStatus).not.toHaveBeenCalled();
  });
});
