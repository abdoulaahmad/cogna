import type { FulfillOrderInput, FulfillOrderResult } from '@/types/provider.types'

/**
 * IProvider — the contract every fulfillment provider adapter must implement.
 *
 * Adding a new provider (e.g. Xpress, TopUp Africa) means implementing this
 * interface and registering it in ProviderFactory. No other files change.
 */
export interface IProvider {
  /** Submit an order to the provider for fulfillment */
  fulfillOrder(input: FulfillOrderInput): Promise<FulfillOrderResult>

  /** Check the status of a previously submitted provider order */
  checkOrderStatus(providerOrderId: string): Promise<FulfillOrderResult>
}
