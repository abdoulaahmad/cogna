export class AppError extends Error {
  public readonly statusCode: number
  public readonly errors: unknown[]

  constructor(message: string, statusCode = 500, errors: unknown[] = []) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.errors = errors
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors: unknown[] = []) {
    super(message, 422, errors)
    this.name = 'ValidationError'
  }
}
