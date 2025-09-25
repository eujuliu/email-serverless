import { pino } from "pino";
import { vi } from "vitest";
import { PrismaClient } from "../../generated/prisma/index.js";
import { initializeConfig } from "../config.js";
import { initializeRabbitMQ } from "../infra/rabbitmq.js";

vi.mock("pino", () => ({
	pino: vi.fn().mockReturnValue({
		error: vi.fn(),
		info: vi.fn(),
	}),
}));

vi.mock("../config", () => ({
	initializeConfig: vi.fn().mockReturnValue({
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
		},
		task: { findFirst: vi.fn() },
		error: { createMany: vi.fn() },

		$disconnect: vi.fn(),
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

vi.mock("../infra/redis", () => ({
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
		sendMail: vi.fn().mockReturnValue({
			rejected: null,
			rejectedErrors: null,
		}),
	}),
}));

export const mockHonoContext = {
	var: { logger: pino() },
	get: vi.fn(),
	req: {
		json: vi.fn(),
		param: vi.fn(),
	},
	json: vi.fn(),
	header: vi.fn(),
	status: vi.fn(),
	text: vi.fn(),
};

export const mockPrisma = vi.mockObject(
	new PrismaClient({ errorFormat: "minimal" }),
);

export const mockRabbitMq = vi.mockObject(
	await initializeRabbitMQ(pino(), initializeConfig(pino())),
);
