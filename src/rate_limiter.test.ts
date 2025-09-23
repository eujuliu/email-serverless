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
  const mockContext = mockHonoContext("", {});

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow request and call next when under limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({});

    const middleware = rateLimiter(mockConfig, mockRedis as any);

    await middleware(mockContext as any, mockHonoNext);

    expect(mockHonoNext).toHaveBeenCalled();
    expect(mockContext.header).toHaveBeenCalledWith(
      "X-Ratelimit-Remaining",
      "9",
    );
    expect(mockContext.header).toHaveBeenCalledWith("X-Ratelimit-Limit", "10");
    expect(mockContext.status).not.toHaveBeenCalled();
  });

  it("should deny request and return 429 when over limit", async () => {
    (mockRedis.hGetAll as any).mockResolvedValue({ "1": "10" });

    const middleware = rateLimiter(mockConfig, mockRedis as any);

    await middleware(mockContext as any, mockHonoNext);

    expect(mockHonoNext).not.toHaveBeenCalled();
    expect(mockContext.status).toHaveBeenCalledWith(429);
    expect(mockContext.text).toHaveBeenCalledWith("Rate Limit Exceeded");
  });
});
