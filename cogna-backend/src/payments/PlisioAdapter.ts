import crypto from 'crypto'
import https from 'https'
import type { IPaymentGateway } from './IPaymentGateway'
import type { InitPaymentOptions } from '@/types/init-payment-options.types'
import type { PaymentInitResult } from '@/types/payment-init-result.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'
import { env } from '@/config/env'
import { PaymentGatewayError } from '@/utils/errors'

const PLISIO_BASE_URL = 'https://plisio.net/api/v1'

// Plisio payment currency for USDT on BEP20 (BSC)
const PLISIO_CRYPTO_CURRENCY = 'USDT_BSC'

// ─── Internal HTTP helper ────────────────────────────────────────────────────

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch { reject(new Error('Plisio returned non-JSON response')) }
      })
    }).on('error', reject)
  })
}

// ─── Plisio-specific response shapes ────────────────────────────────────────

interface PlisioInvoiceResponse {
  status: string
  data?: {
    txn_id?: string
    invoice_url?: string
    invoice_total_sum?: number | string
  }
}

interface PlisioOperationResponse {
  status: string
  data?: {
    status?: string // completed | mismatch | expired | cancelled | new | pending
    txn_id?: string
    amount?: number | string
    currency?: string
    source_currency?: string
    source_amount?: number | string
  }
}

// ─── Signature verification ──────────────────────────────────────────────────
// Plisio sends a POST body and includes a `verify_hash` field.
// Verification: remove `verify_hash` from the fields, sort remaining keys
// alphabetically, serialize as query-string, hash with MD5(secretKey + sorted).
// Reference: https://plisio.net/documentation/endpoints/callbacks

/**
 * Plisio webhook hash per official docs:
 * 1. Remove 'verify_hash' field.
 * 2. Sort remaining keys alphabetically.
 * 3. Serialize as JSON-like: "key1=val1&key2=val2" (query-string style).
 * 4. Prepend the API secret key.
 * 5. MD5 the whole string.
 */
function buildPlisioVerifyHash(fields: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(fields)
    .filter((k) => k !== 'verify_hash')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('&')
  return crypto.createHash('md5').update(secretKey + sorted).digest('hex')
}

// ─── Test-mode stubs ─────────────────────────────────────────────────────────

const isTestMode = () => env.PLISIO_TEST_MODE === 'true'

/** Plisio crypto payment gateway (USDT BEP20 / BSC). */
export class PlisioAdapter implements IPaymentGateway {
  private readonly secretKey: string

  constructor(secretKey?: string) {
    this.secretKey = secretKey ?? env.PLISIO_SECRET_KEY ?? ''
  }

  async initializePayment(options: InitPaymentOptions): Promise<PaymentInitResult> {
    if (!this.secretKey && !isTestMode()) throw new PaymentGatewayError('Plisio secret key is not configured')

    // In test mode skip the real API call and return a deterministic stub URL
    if (isTestMode()) {
      const baseUrl = env.APP_URL ?? 'http://localhost:3000'
      return {
        authorizationUrl: `${baseUrl}/wallet/crypto-test-invoice?ref=${options.reference}`,
        reference: options.reference,
        gatewayReference: `test_${options.reference}`,
      }
    }

    // options.amount is already the USDT amount (set by initializeCryptoFunding)
    const params = new URLSearchParams({
      api_key: this.secretKey,
      currency: PLISIO_CRYPTO_CURRENCY,
      amount: String(options.amount),
      order_number: options.reference,
      order_name: `Cogna Wallet Funding — ${options.reference}`,
      callback_url: options.callbackUrl ?? '',
      ...(options.email ? { email: options.email } : {}),
    })

    const url = `${PLISIO_BASE_URL}/invoices/new?${params.toString()}`

    let raw: unknown
    try { raw = await httpsGet(url) }
    catch (err) { throw new PaymentGatewayError(`Plisio network error: ${(err as Error).message}`) }

    const body = raw as PlisioInvoiceResponse
    if (body.status !== 'success' || !body.data?.invoice_url) {
      throw new PaymentGatewayError(`Plisio invoice creation failed: ${body.status}`)
    }

    return {
      authorizationUrl: body.data.invoice_url,
      reference: options.reference,
      gatewayReference: body.data.txn_id ?? undefined,
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    if (!this.secretKey && !isTestMode()) throw new PaymentGatewayError('Plisio secret key is not configured')

    if (isTestMode()) {
      // Test mode: treat any reference starting with 'test_' as confirmed
      return {
        status: 'success',
        amount: 0,      // caller should use the locked amount from the DB
        currency: 'USDT_BSC',
        gatewayReference: reference,
        paidAt: new Date(),
        metadata: { testMode: true },
      }
    }

    const params = new URLSearchParams({ api_key: this.secretKey })
    const url = `${PLISIO_BASE_URL}/operations/${encodeURIComponent(reference)}?${params.toString()}`

    let raw: unknown
    try { raw = await httpsGet(url) }
    catch (err) { throw new PaymentGatewayError(`Plisio network error: ${(err as Error).message}`) }

    const body = raw as PlisioOperationResponse
    if (body.status !== 'success' || !body.data) {
      throw new PaymentGatewayError(`Plisio operation lookup failed: ${body.status}`)
    }

    const opStatus = body.data.status ?? 'pending'
    const mapped: 'success' | 'failed' | 'pending' =
      opStatus === 'completed' || opStatus === 'mismatch'
        ? 'success'
        : opStatus === 'expired' || opStatus === 'cancelled'
          ? 'failed'
          : 'pending'

    return {
      status: mapped,
      amount: Number(body.data.source_amount ?? body.data.amount ?? 0),
      currency: body.data.source_currency ?? body.data.currency ?? 'USDT_BSC',
      gatewayReference: body.data.txn_id ?? reference,
      paidAt: mapped === 'success' ? new Date() : null,
      metadata: body.data as Record<string, unknown>,
    }
  }

  validateWebhook(payload: string, _signature: string): boolean {
    // Plisio sends application/x-www-form-urlencoded POST
    // The "signature" parameter we pass is the verify_hash value extracted from the body
    try {
      const fields = Object.fromEntries(new URLSearchParams(payload).entries())
      const expected = buildPlisioVerifyHash(fields, this.secretKey)
      const provided = fields['verify_hash'] ?? ''
      if (!provided) return false
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(provided, 'hex'),
      )
    } catch {
      return false
    }
  }
}
