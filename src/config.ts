import type pino from "pino";
import z from "zod";

const Schema = z.object({
  PORT: z.preprocess((val) => Number(val), z.number().default(3000)),
  NODE_ENV: z.string().default("production"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  REDIS_HOST: z.string().min(1, "REDIS_URL is required"),
  REDIS_PORT: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "REDIS_PORT is required"),
  ),
  REDIS_USERNAME: z.string().default(""),
  REDIS_PASSWORD: z.string().default(""),

  RATE_LIMITER_LIMIT: z.preprocess(
    (val) => (val ? Number(val) : 10),
    z.number(),
  ),
  RATE_LIMITER_WINDOWSIZE: z.preprocess(
    (val) => (val ? Number(val) : 60),
    z.number(),
  ),
  RATE_LIMITER_SUBWINDOWSIZE: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number(),
  ),
});

export type Config = z.infer<typeof Schema>;

export function initializeConfig(logger: pino.Logger<never, boolean>): Config {
  try {
    const result = Schema.safeParse(process.env);

    if (result.error) {
      throw new Error(z.prettifyError(result.error));
    }

    return result.data;
  } catch (err) {
    logger.error((err as Error).message);
    throw new Error(
      "Invalid or missing environment variables. Check logs for details.",
    );
  }
}
