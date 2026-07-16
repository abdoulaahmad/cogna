function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractDeliveryItems(providerResponse: unknown): string[] {
  if (!isRecord(providerResponse) || !isRecord(providerResponse.rawResponse)) return []
  const rawResponse = providerResponse.rawResponse
  const payload = isRecord(rawResponse.data) ? rawResponse.data : rawResponse
  if (!Array.isArray(payload.items)) return []
  return payload.items.filter((item): item is string => typeof item === 'string')
}

/** Removes provider diagnostics and optionally exposes only customer deliverables. */
export function toCustomerOrderView<T extends { providerResponse: unknown }>(order: T, includeDelivery: boolean) {
  const { providerResponse, ...safeOrder } = order
  return includeDelivery
    ? { ...safeOrder, deliveryItems: extractDeliveryItems(providerResponse) }
    : safeOrder
}