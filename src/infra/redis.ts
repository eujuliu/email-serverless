import type pino from "pino";
import { createClient } from "redis";
import type { Config } from "../config.js";

export default async function initializeRedis(
  logger: pino.Logger<never, boolean>,
  config: Config,
) {
  const client = createClient({
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
    socket: {
      port: config.REDIS_PORT,
      host: config.REDIS_HOST,
    },
  });

  client.on("error", (err) =>
    logger.error(`[redis] ${(err as Error).message}`),
  );
  client.once("connect", () => logger.info("connected to redis with success!"));

  await client.connect();

  return client;
}
