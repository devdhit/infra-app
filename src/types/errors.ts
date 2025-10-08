// Define custom error types for the application
export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  public validationErrors: Record<string, string>;
  
  constructor(
    message: string,
    validationErrors: Record<string, string>,
    data?: unknown
  ) {
    super(400, message, data);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string) {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

// Type guard functions for error handling
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}