export type VerifiedPayment = {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderId: string;
};

/** Sequential checks allow delayed confirmations without overlapping requests. */
export async function pollPaymentVerification(options: {
  verify: () => Promise<VerifiedPayment>;
  onResult: (payment: VerifiedPayment) => void;
  onError: (error: unknown) => void;
  signal: AbortSignal;
  attempts?: number;
  intervalMs?: number;
}): Promise<void> {
  const { verify, onResult, onError, signal, attempts = 12, intervalMs = 5000 } = options;
  for (let attempt = 0; attempt < attempts && !signal.aborted; attempt++) {
    try {
      const payment = await verify();
      if (signal.aborted) return;
      onResult(payment);
      if (payment.status !== 'PENDING') return;
    } catch (error: unknown) {
      if (signal.aborted) return;
      if (attempt === attempts - 1) onError(error);
    }
    if (attempt === attempts - 1 || signal.aborted) return;
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, intervalMs);
      signal.addEventListener('abort', finish, { once: true });
    });
  }
}
