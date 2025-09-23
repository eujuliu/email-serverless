import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimiter } from "./rate_limiter.js";
import type { Config } from "./config.js";
import type { RedisClientType } from "redis";
import type { Context, Next } from "hono";

vi.mock("@hono/node-server/conninfo", () => ({
  getConnInfo: vi.fn(() => ({
    remote: { address: "127.0.0.1" },
  })),
}));

describe("Rate Limiter Middleware", () => {
  let mockConfig: Config;
  let mockRedis: Partial<RedisClientType>;
  let mockContext: Partial<Context>;
  let mockNext: Next;

  beforeEach(() => {
    mockConfig = {
      RATE_LIMITER_LIMIT: 10,
      RATE_LIMITER_WINDOWSIZE: 60,
      RATE_LIMITER_SUBWINDOWSIZE: 20,
    } as Config;

    mockRedis = {
      hGetAll: vi.fn(),
      multi: vi.fn(() => ({
        hIncrBy: vi.fn().mockReturnThis(),
        hExpire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      })),
    };

    mockContext = {
      header: vi.fn(),
      status: vi.fn(),
      text: vi.fn(),
    };

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  it("should allow request and call next when under limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({});

    const middleware = rateLimiter(mockConfig, mockRedis as RedisClientType);

    await middleware(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockContext.header).toHaveBeenCalledWith(
      "X-Ratelimit-Remaining",
      "9",
    );
    expect(mockContext.header).toHaveBeenCalledWith("X-Ratelimit-Limit", "10");
    expect(mockContext.status).not.toHaveBeenCalled();
  });

  it("should deny request and return 429 when over limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({ "1": "10" });

    const middleware = rateLimiter(mockConfig, mockRedis as RedisClientType);

    await middleware(mockContext as Context, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.status).toHaveBeenCalledWith(429);
    expect(mockContext.text).toHaveBeenCalledWith("Rate Limit Exceeded");
  });
});
