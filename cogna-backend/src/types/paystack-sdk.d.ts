declare module '@paystack/paystack-sdk' {
  export interface PaystackSdkResponse {
    status?: boolean
    message?: string
    data?: unknown
  }

  export interface PaystackInitializeRequest {
    email: string
    amount: number
    currency?: string
    reference?: string
    callback_url?: string
    metadata?: string
  }

  export default class Paystack {
    constructor(secretKey: string)
    transaction: {
      initialize(request: PaystackInitializeRequest): Promise<PaystackSdkResponse>
      verify(request: { reference: string }): Promise<PaystackSdkResponse>
    }
  }
}