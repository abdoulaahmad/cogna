import { describe, expect, it } from 'vitest'
import { toCustomerOrderView } from '@/utils/order-delivery'

describe('toCustomerOrderView', () => {
  const order = {
    id: 'order-1',
    providerResponse: {
      status: 'COMPLETED',
      rawResponse: { id: 11014, status: 'delivered', items: ['delivery-item'] },
    },
  }

  it('removes provider diagnostics from order summaries', () => {
    expect(toCustomerOrderView(order, false)).toEqual({ id: 'order-1' })
  })

  it('exposes only string delivery items on order details', () => {
    expect(toCustomerOrderView(order, true)).toEqual({ id: 'order-1', deliveryItems: ['delivery-item'] })
  })

  it('supports provider responses wrapped in data', () => {
    const wrapped = { ...order, providerResponse: { rawResponse: { data: { items: ['wrapped-item'] } } } }
    expect(toCustomerOrderView(wrapped, true)).toMatchObject({ deliveryItems: ['wrapped-item'] })
  })
})