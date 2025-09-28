import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type JwtVariables, jwt } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";
import { pinoLogger } from "hono-pino";
import { pino } from "pino";
import type { RedisClientType } from "redis";
import type z from "zod";
import { PrismaClient } from "../../generated/prisma/index.js";
import { createConfig } from "../config.js";
import { createEmailHandler } from "../handlers/create_email.js";
import { deleteEmailHandler } from "../handlers/delete_email.js";
import { getEmailHandler } from "../handlers/get_email.js";
import { getEmailsHandler } from "../handlers/get_emails.js";
import {
  type SendEmailsRequest,
  sendEmailsHandler,
} from "../handlers/send_emails.js";
import { updateEmailHandler } from "../handlers/update_email.js";
import { honoHandler } from "../helpers.js";
import { createTransporter } from "../infra/email.js";
import { logger } from "../infra/logger.js";
import {
  consume,
  createRabbitMQ,
  ensureQueue,
  publish,
} from "../infra/rabbitmq.js";
import { rateLimiter } from "../infra/rate_limiter.js";
import { createRedis } from "../infra/redis.js";

export type JwtClaims = {
  userId: string;
  email: string;
};

export type Env = {
  Variables: JwtVariables & {
    data: Record<string, unknown>;
  };
};

export const app = new Hono<Env>();

async function main() {
  const config = createConfig(process.env);
  const { PORT, JWT_SECRET } = config;

  const prisma = new PrismaClient({
    errorFormat: "minimal",
  });
  const redis = await createRedis(config);
  const rabbitmq = await createRabbitMQ(config);
  const email = createTransporter(config);

  await ensureQueue(rabbitmq.channel, "email-task", "tasks", "task.email.send");
  await ensureQueue(rabbitmq.channel, "task-result", "tasks", "task.result");

  const jwtMiddleware = jwt({
    secret: JWT_SECRET,
  });
  const rateLimiterMiddleware = rateLimiter(
    config,
    redis as unknown as RedisClientType,
  );

  app.use(
    pinoLogger({
      pino: pino,
    }),
  );

  app.get("/ping", (c) => {
    return c.text("pong");
  });

  app.use(cors());
  app.use(secureHeaders());

  app.post(
    "/email",
    rateLimiterMiddleware,
    jwtMiddleware,
    honoHandler(createEmailHandler, prisma),
  );
  app.put(
    "/email/:id",
    rateLimiterMiddleware,
    jwtMiddleware,
    honoHandler(updateEmailHandler, prisma),
  );
  app.delete(
    "/email/:id",
    rateLimiterMiddleware,
    jwtMiddleware,
    honoHandler(deleteEmailHandler, prisma),
  );
  app.get(
    "/email/:id",
    rateLimiterMiddleware,
    jwtMiddleware,
    honoHandler(getEmailHandler, prisma),
  );
  app.get(
    "/emails",
    rateLimiterMiddleware,
    jwtMiddleware,
    honoHandler(getEmailsHandler, prisma),
  );

  await consume(rabbitmq.channel, "email-task", async (data) => {
    const result = await sendEmailsHandler(
      data as z.infer<typeof SendEmailsRequest>,
      prisma,
      email,
    );

    await publish(
      rabbitmq.channel,
      "tasks-result",
      "tasks",
      Buffer.from(JSON.stringify(result)),
    );
  });

  process.once("SIGTERM", async () => {
    logger.info("SIGTERM received, closing server!");
    await redis.close();
    await prisma.$disconnect();
    await rabbitmq.channel.close();
    await rabbitmq.connection.close();
    process.exit(0);
  });

  serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    async (info) => {
      logger.info(`running on http://${info.address}:${info.port}`);
    },
  );
}

main().catch(console.error);
