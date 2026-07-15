import prisma from '@/config/database';
import type { Prisma, ProviderWebhookEvent } from '@prisma/client';

export const ProviderWebhookRepository = {
  /**
   * Find a webhook event by its event ID and provider
   */
  async findByEventId(providerId: string, eventId: string): Promise<ProviderWebhookEvent | null> {
    return prisma.providerWebhookEvent.findUnique({
      where: {
        providerId_eventId: { providerId, eventId },
      },
    });
  },

  /**
   * Find a webhook event by its unique payload hash and provider
   */
  async findByPayloadHash(providerId: string, payloadHash: string): Promise<ProviderWebhookEvent | null> {
    return prisma.providerWebhookEvent.findUnique({
      where: {
        providerId_payloadHash: { providerId, payloadHash },
      },
    });
  },

  /**
   * Create a new recorded provider webhook event
   */
  async create(data: {
    providerId: string;
    eventId: string;
    payloadHash: string;
    eventType: string;
    payload: Record<string, unknown>;
    status?: string;
  }): Promise<ProviderWebhookEvent> {
    return prisma.providerWebhookEvent.create({
      data: {
        providerId: data.providerId,
        eventId: data.eventId,
        payloadHash: data.payloadHash,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
        status: data.status ?? 'RECEIVED',
      },
    });
  },

  /**
   * Update the status of a processed webhook event
   */
  async updateStatus(
    id: string,
    status: 'RECEIVED' | 'PROCESSED' | 'FAILED',
    processedAt?: Date
  ): Promise<ProviderWebhookEvent> {
    return prisma.providerWebhookEvent.update({
      where: { id },
      data: {
        status,
        processedAt: processedAt ?? new Date(),
      },
    });
  },
};
