export class HandledResponseError extends Error {
  constructor() {
    super('HandledResponseError');

    // Set the prototype explicitly
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HandledResponseError.prototype);
  }
}
