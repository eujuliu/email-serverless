import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimiter } from "./rate_limiter.js";
import {
  mockConfig,
  mockRedis,
  mockHonoContext,
  mockHonoNext,
} from "./test/mocks.js";

vi.mock("@hono/node-server/conninfo", () => ({
  getConnInfo: vi.fn(() => ({
    remote: { address: "127.0.0.1" },
  })),
}));

describe("Rate Limiter Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request and call next when under limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({});

    const middleware = rateLimiter(mockConfig, mockRedis as any);

    await middleware(mockHonoContext as any, mockHonoNext);

    expect(mockHonoNext).toHaveBeenCalled();
    expect(mockHonoContext.header).toHaveBeenCalledWith(
      "X-Ratelimit-Remaining",
      "9",
    );
    expect(mockHonoContext.header).toHaveBeenCalledWith(
      "X-Ratelimit-Limit",
      "10",
    );
    expect(mockHonoContext.status).not.toHaveBeenCalled();
  });

  it("should deny request and return 429 when over limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({ "1": "10" });

    const middleware = rateLimiter(mockConfig, mockRedis as any);

    await middleware(mockHonoContext as any, mockHonoNext);

    expect(mockHonoNext).not.toHaveBeenCalled();
    expect(mockHonoContext.status).toHaveBeenCalledWith(429);
    expect(mockHonoContext.text).toHaveBeenCalledWith("Rate Limit Exceeded");
  });
});
