import type { ContentfulStatusCode } from "hono/utils/http-status";

export class BaseError extends Error {
  code: ContentfulStatusCode;

  constructor({ message, name, code }: BaseError) {
    super();
    this.message = message;
    this.name = name;
    this.code = code;
  }
}

export class InternalServerError extends BaseError {
  constructor({ message }: Partial<BaseError>) {
    super({
      message: message || "An unexpected error happens",
      name: "InternalServerError",
      code: 500,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ message }: Partial<BaseError>) {
    super({
      message: message || "Is not possible to find this resource",
      name: "NotFoundError",
      code: 404,
    });
  }
}

export class ValidationError extends BaseError {
  constructor({ message }: Partial<BaseError>) {
    super({
      message: message || "A validation error happens",
      name: "ValidationError",
      code: 400,
    });
  }
}

export class DeliveryError extends BaseError {
  relation: string[][];

  constructor({ message, relation }: Partial<BaseError & DeliveryError>) {
    super({
      message: message || "A delivery error happens",
      name: "DeliveryError",
      code: 422,
    });
    this.relation = relation || [];
  }
}

export class ConflictError extends BaseError {
  constructor({ message }: Partial<BaseError>) {
    super({
      message: message || "Conflict with the current state",
      name: "ConflictError",
      code: 409,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message }: Partial<BaseError>) {
    super({
      message: message || "Not authorized to access the resource",
      name: "UnauthorizedError",
      code: 401,
    });
  }
}
