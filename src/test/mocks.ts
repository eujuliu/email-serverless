import { vi } from "vitest";
import { PrismaClient } from "../../generated/prisma/index.js";
import { createConfig } from "../config.js";
import { logger } from "../infra/logger.js";
import { createRabbitMQ } from "../infra/rabbitmq.js";

vi.mock("../infra/logger", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../config", () => ({
	createConfig: vi.fn().mockReturnValue({
		EMAIL_SMTP_HOST: "",
		NODE_ENV: "debug",
		EMAIL_USER: "",
		EMAIL_PASSWORD: "",
		EMAIL_FROM: "",
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
			delete: vi.fn(),
		},
		task: { findFirst: vi.fn() },
		error: { createMany: vi.fn() },
	}),
}));

vi.mock("../infra/rabbitmq", () => ({
	createRabbitMQ: vi.fn().mockReturnValue({
		connection: vi.fn(),
		channel: vi.fn().mockReturnValue({
			ack: vi.fn(),
			nack: vi.fn(),
		}),
	}),

	publish: vi.fn(),
	consume: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("../infra/redis", () => ({
	createRedis: vi.fn().mockReturnValue({
		hGetAll: vi.fn(),
		multi: vi.fn(() => ({
			hIncrBy: vi.fn().mockReturnThis(),
			hExpire: vi.fn().mockReturnThis(),
			exec: vi.fn().mockResolvedValue([]),
		})),
	}),
}));

vi.mock("../infra/email", () => ({
	createTransporter: vi.fn().mockReturnValue({
		sendMail: vi.fn().mockResolvedValue({
			rejected: [],
			rejectedErrors: [],
		}),
	}),
}));

export const mockPrisma = vi.mockObject(
	new PrismaClient({ errorFormat: "minimal" }),
);

export const mockRabbitMq = vi.mockObject(
	await createRabbitMQ(logger, createConfig(process.env)),
);

export const mockConfig = vi.mockObject(createConfig(process.env));
