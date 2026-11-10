import axios from 'axios'

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: unknown }>(error)) {
    const data = error.response?.data
    const message = data?.message ?? error.message ?? fallback
    const details = Array.isArray(data?.errors) ? data.errors.flatMap((issue: unknown) => {
      if (!issue || typeof issue !== 'object' || !('message' in issue) || typeof issue.message !== 'string') return []
      const field = 'field' in issue && typeof issue.field === 'string' ? issue.field : ''
      return [field ? `${field}: ${issue.message}` : issue.message]
    }) : []
    return details.length ? `${message}: ${details.join('; ')}` : message
  }
  return error instanceof Error ? error.message : fallback
}
