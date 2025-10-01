import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { PoolClient } from "pg";
import type z from "zod";
import { DeliveryError } from "./errors/index.js";
import { logger } from "./infra/logger.js";

export function getUserIp(c: Context): string {
  const info = getConnInfo(c);
  const rawIP = info.remote.address;

  if (!rawIP) {
    return "unknown";
  }

  if (rawIP.startsWith("::ffff:")) {
    return rawIP.substring(7);
  }

  if (rawIP === "::1") {
    return "127.0.0.1";
  }

  return rawIP;
}

export function createDBErrorEntities(
  data: Record<string, string | number>,
  err: Error,
): Record<string, unknown>[] {
  if (err instanceof DeliveryError) {
    return err.relation.map((error) => ({
      reason: error.join(": "),
      referenceId: data.id as string,
      type: "email",
      userId: data.userId as string,
    }));
  }

  return [
    {
      reason: err.message,
      type: "email",
      referenceId: data.id as string,
      userId: data.userId as string,
    },
  ];
}

export function honoHandler<T>(
  handler: (
    data: T,
    db: PoolClient,
  ) => Promise<{ result: unknown; code: number }>,
  db: PoolClient,
) {
  return async (c: Context) => {
    const body = !["GET", "DELETE"].includes(c.req.method)
      ? await c.req.json()
      : {};
    logger.debug(body);

    const data = {
      ...body,
      ...c.req.param(),
      ...c.get("jwtPayload"),
    };

    logger.debug(data);

    const result = await handler(data as T, db);

    if (!result.result) {
      return c.body(null, result.code as ContentfulStatusCode);
    }

    return c.json(result.result, result.code as ContentfulStatusCode);
  };
}

export function minifyZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}=${issue.message}`)
    .join("; ");
}
