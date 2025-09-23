import type { RedisClientType } from "redis";
import type { Config } from "./config.js";
import type { Context, Next } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { getUserIp } from "./helpers.js";

export function rateLimiter(config: Config, redis: RedisClientType) {
  return async (c: Context, next: Next) => {
    const ip = getUserIp(c);
    const key = `rate_limit:${ip}`;
    const subs = await redis.hGetAll(key);

    const total = Object.values(subs).reduce<number>(
      (prev, crr) => prev + parseInt(crr, 10),
      0,
    );

    const allowed = total < config.RATE_LIMITER_LIMIT;

    if (allowed) {
      const currentTime = Date.now();
      const subWindowSizeMillis = config.RATE_LIMITER_SUBWINDOWSIZE * 1000;
      const currentSubWindow = Math.round(currentTime / subWindowSizeMillis);

      await redis
        .multi()
        .hIncrBy(key, currentSubWindow.toString(), 1)
        .hExpire(
          key,
          currentSubWindow.toString(),
          config.RATE_LIMITER_WINDOWSIZE,
          "NX",
        )
        .exec()
        .catch((err) => {
          throw new Error((err as Error).message);
        });

      c.header(
        "X-Ratelimit-Remaining",
        Math.max(config.RATE_LIMITER_LIMIT - total - 1, 0).toString(),
      );
      c.header("X-Ratelimit-Limit", config.RATE_LIMITER_LIMIT.toString());

      await next();
      return;
    }

    c.status(429);
    return c.text("Rate Limit Exceeded");
  };
}
