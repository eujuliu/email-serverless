import z from "zod";
import { logger } from "./infra/logger.js";

const Schema = z.object({
  PORT: z.preprocess((val) => Number(val), z.number().default(3000)),
  NODE_ENV: z.string().default("production"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  POSTGRES_USER: z.string().min(1, "POSTGRES_USER is required"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD is required"),
  POSTGRES_DB: z.string().min(1, "POSTGRES_DB is required"),
  POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST is required"),
  POSTGRES_PORT: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "POSTGRES_PORT is required"),
  ),

  REDIS_HOST: z.string().min(1, "REDIS_URL is required"),
  REDIS_PORT: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "REDIS_PORT is required"),
  ),
  REDIS_USERNAME: z.string().default(""),
  REDIS_PASSWORD: z.string().default(""),
  RABBITMQ_CONNECTION_STRING: z
    .string()
    .min(1, "RABBITMQ_CONNECTION_STRING is required"),

  EMAIL_SMTP_HOST: z.string().min(1, "EMAIL_SMTP_HOST is required"),
  EMAIL_SMTP_PORT: z.string().min(1, "EMAIL_SMTP_PORT is required"),
  EMAIL_USER: z.string().min(1, "EMAIL_USER is required"),
  EMAIL_PASSWORD: z.string().default(""),

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

export function createConfig(env: Record<string, unknown>): Config {
  try {
    const result = Schema.safeParse(env);

    if (result.error) {
      throw new Error(z.prettifyError(result.error));
    }

    return result.data;
  } catch (err) {
    logger.debug(env);
    logger.error((err as Error).message);

    throw new Error(
      "Invalid or missing environment variables. Check logs for details.",
    );
  }
}
