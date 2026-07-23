import { PlisioAdapter } from '@/payments/PlisioAdapter'
import crypto from 'crypto'
import { describe, it, expect } from 'vitest'

describe('PlisioAdapter', () => {
  describe('validateWebhook', () => {
    it('should correctly validate a genuine Plisio webhook signature', () => {
      const secretKey = 'test_secret_key'
      const adapter = new PlisioAdapter(secretKey)

      // Mock webhook payload (simulating form-urlencoded data sent by Plisio)
      // Plisio docs: MD5(secretKey + sorted_fields_excluding_verify_hash_joined_by_ampersand)
      const fields = {
        amount: '10.50',
        currency: 'USDT_BSC',
        order_name: 'Test Invoice',
        order_number: 'ref_12345',
        source_amount: '10.50',
        source_currency: 'USDT',
        source_rate: '1.00',
        status: 'completed',
        txn_id: 'tx_abc123'
      }

      // Generate the expected hash
      const sortedKeys = Object.keys(fields).sort()
      const concatenated = sortedKeys.map(k => `${k}=${fields[k as keyof typeof fields]}`).join('&')
      
      // Note: The adapter implementation currently hashes `secretKey + sorted`.
      // Let's ensure this matches the adapter's logic.
      const verifyHash = crypto.createHash('md5').update(secretKey + concatenated).digest('hex')

      // Create URLSearchParams string (form-urlencoded) to simulate raw body
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(fields)) {
        params.append(key, value)
      }
      params.append('verify_hash', verifyHash)

      const rawBody = params.toString()

      // The adapter validateWebhook should return true
      expect(adapter.validateWebhook(rawBody, '')).toBe(true)
    })

    it('should reject a webhook with invalid signature', () => {
      const adapter = new PlisioAdapter('test_secret_key')

      const fields = {
        amount: '10.50',
        currency: 'USDT_BSC',
        order_name: 'Test Invoice',
        order_number: 'ref_12345',
        status: 'completed',
      }
      
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(fields)) {
        params.append(key, value)
      }
      params.append('verify_hash', 'invalidhash1234567890abcdef123456')

      const rawBody = params.toString()

      expect(adapter.validateWebhook(rawBody, '')).toBe(false)
    })
  })
})
