import { vi } from "vitest";

vi.mock("pino", () => ({
  pino: vi.fn().mockReturnValue({
    error: vi.fn(),
  }),
}));

vi.mock("../config.ts", () => ({
  initializeConfig: vi.fn().mockReturnValue({
    RATE_LIMITER_LIMIT: 10,
    RATE_LIMITER_WINDOWSIZE: 60,
    RATE_LIMITER_SUBWINDOWSIZE: 20,

    EMAIL_SMTP_HOST: "smtp.example.com",
    EMAIL_SMTP_PORT: 587,
    EMAIL_USER: "user@example.com",
    EMAIL_PASSWORD: "password",
    EMAIL_FROM: "from@example.com",
  }),
}));

vi.mock("../../generated/prisma/index.js", () => ({
  PrismaClient: vi.fn().mockReturnValue({
    user: { findFirst: vi.fn() },
    email: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    task: { findFirst: vi.fn() },
  }),
}));

vi.mock("../infra/rabbitmq", () => ({
  initializeRabbitMQ: vi.fn().mockReturnValue({
    connection: vi.fn(),
    channel: vi.fn().mockReturnValue({
      ack: vi.fn(),
      nack: vi.fn(),
    }),
  }),

  publish: vi.fn(),
  consume: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("../infra/redis.ts", () => ({
  initializeRedis: vi.fn().mockReturnValue({
    hGetAll: vi.fn(),
    multi: vi.fn(() => ({
      hIncrBy: vi.fn().mockReturnThis(),
      hExpire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  }),
}));

vi.mock("nodemailer", () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn(),
  }),
}));
