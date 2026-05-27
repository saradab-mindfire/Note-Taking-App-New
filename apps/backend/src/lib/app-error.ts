/**
 * Typed HTTP error thrown from service and controller layers.
 * The global error handler catches these and maps them to HTTP responses.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintain proper prototype chain in transpiled code
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
