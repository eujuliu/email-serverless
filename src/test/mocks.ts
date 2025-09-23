import { vi } from "vitest";
import type { JwtClaims } from "../index.js";
import type { Config } from "../config.js";
import type { Next } from "hono";

const mockConfig = {
  RATE_LIMITER_LIMIT: 10,
  RATE_LIMITER_WINDOWSIZE: 60,
  RATE_LIMITER_SUBWINDOWSIZE: 20,
} as Config;

const mockRedis = {
  hGetAll: vi.fn(),
  multi: vi.fn(() => ({
    hIncrBy: vi.fn().mockReturnThis(),
    hExpire: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
  })),
};

const mockLogger = {
  error: vi.fn(),
};

const mockPrisma = {
  user: { findFirst: vi.fn() },
  email: { create: vi.fn() },
};

const mockHonoContext = {
  var: { logger: mockLogger },
  get: vi.fn((key: "prisma" | "jwtPayload") => {
    const vars = {
      prisma: mockPrisma,
      jwtPayload: {
        userId: "d30d037e-de9d-4214-b84a-08d70f6365d1",
      } as JwtClaims,
    };

    return vars[key];
  }),
  req: { json: vi.fn() },
  json: vi.fn(),
  header: vi.fn(),
  status: vi.fn(),
  text: vi.fn(),
};

const mockHonoNext = vi.fn().mockResolvedValue(undefined) as Next;

export {
  mockConfig,
  mockRedis,
  mockLogger,
  mockPrisma,
  mockHonoContext,
  mockHonoNext,
};
