/**
 * Recursively redacts sensitive fields such as secrets, tokens, API keys, passwords, and authorization data.
 */
export function redactSensitiveData<T>(data: T): T {
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item)) as unknown as T
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (/secret|token|key|password|auth|authorization|credential|hash/i.test(key)) {
      redacted[key] = '••••••••'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted as T
}
