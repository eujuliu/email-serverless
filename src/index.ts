import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type JwtVariables, jwt } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";
import { pinoLogger } from "hono-pino";
import { pino } from "pino";
import { initializeConfig } from "./config.js";
import initializeRedis from "./redis.js";
import { rateLimiter } from "./middleware.js";

type Variables = JwtVariables;

async function main() {
  const app = new Hono<{ Variables: Variables }>();
  const logger = pino();
  const config = initializeConfig(logger);
  const { PORT, NODE_ENV, JWT_SECRET } = config;
  const redis = await initializeRedis(logger, config);

  const jwtMiddleware = jwt({
    secret: JWT_SECRET,
  });
  const rateLimiterMiddleware = rateLimiter(config, redis);
  app.use(
    pinoLogger({
      pino: { level: NODE_ENV.match(/prod/) ? "info" : "debug" },
    }),
  );
  app.use(cors());
  app.use(secureHeaders());

  app.get("/ping", (c) => {
    return c.text("pong");
  });

  app.post("/email", rateLimiterMiddleware, jwtMiddleware, (c) => {
    return c.text("Hello Hono!");
  });

  process.once("SIGTERM", async () => {
    logger.info("SIGTERM received, closing server!");
    await redis.close();
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
