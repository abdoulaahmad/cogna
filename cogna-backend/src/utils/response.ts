// Standard API response helpers

export function successResponse<T>(data: T, message = 'Success') {
  return {
    success: true as const,
    message,
    data,
  }
}

export function errorResponse(message: string, errors: unknown[] = []) {
  return {
    success: false as const,
    message,
    errors,
  }
}

export function paginatedResponse<T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
  message = 'Success'
) {
  return {
    success: true as const,
    message,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasNext: meta.page * meta.limit < meta.total,
      hasPrev: meta.page > 1,
    },
  }
}
