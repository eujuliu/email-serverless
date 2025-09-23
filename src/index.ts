import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type JwtVariables, jwt } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";
import { pino, type Logger } from "pino";
import { initializeConfig } from "./config.js";
import initializeRedis from "./redis.js";
import { rateLimiter } from "./rate_limiter.js";
import { PrismaClient } from "../generated/prisma/index.js";
import { createEmailHandler } from "./handlers/create_email.js";
import { pinoLogger } from "hono-pino";
import { updateEmailHandler } from "./handlers/update_email.js";
import { getEmailHandler } from "./handlers/get_email.js";
import { getEmailsHandler } from "./handlers/get_emails.js";

export type JwtClaims = {
  userId: string;
  email: string;
};

export type Env = {
  Variables: JwtVariables & {
    prisma: PrismaClient;
    logger: Logger;
  };
};

export const app = new Hono<Env>();

async function main() {
  const logger = pino();
  const config = initializeConfig(logger);
  const { PORT, NODE_ENV, JWT_SECRET } = config;
  const redis = await initializeRedis(logger, config);
  const prisma = new PrismaClient();

  logger.level = NODE_ENV.match(/prod/) ? "info" : "debug";

  const jwtMiddleware = jwt({
    secret: JWT_SECRET,
  });
  const rateLimiterMiddleware = rateLimiter(config, redis as any);

  app.use(
    pinoLogger({
      pino: pino,
    }),
  );
  app.use(cors());
  app.use(secureHeaders());
  app.use((c, next) => {
    c.set("prisma", prisma);
    c.set("logger", logger);
    return next();
  });

  app.get("/ping", (c) => {
    return c.text("pong");
  });

  app.post("/email", rateLimiterMiddleware, jwtMiddleware, createEmailHandler);
  app.put(
    "/email/:id",
    rateLimiterMiddleware,
    jwtMiddleware,
    updateEmailHandler,
  );
  app.get("/email/:id", rateLimiterMiddleware, jwtMiddleware, getEmailHandler);
  app.get("/emails", rateLimiterMiddleware, jwtMiddleware, getEmailsHandler);

  process.once("SIGTERM", async () => {
    logger.info("SIGTERM received, closing server!");
    await redis.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    (info) => {
      logger.info(`running on http://${info.address}:${info.port}`);
    },
  );
}

main().catch(console.error);
