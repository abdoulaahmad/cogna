declare module '@paystack/inline-js' {
  export interface PaystackTransactionConfig {
    onSuccess?: (transaction: { reference: string; status: string }) => void;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }

  export default class Paystack {
    constructor();
    resumeTransaction(accessCode: string, config?: PaystackTransactionConfig): void;
  }
}
