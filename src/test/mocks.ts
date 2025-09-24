import { pino } from "pino";
import { vi } from "vitest";
import { PrismaClient } from "../../generated/prisma/index.js";

vi.mock("pino", () => ({
	pino: vi.fn().mockReturnValue({
		error: vi.fn(),
		info: vi.fn(),
	}),
}));

vi.mock("../config.ts", () => ({
	initializeConfig: vi.fn().mockReturnValue({
		PORT: 3000,
		NODE_ENV: "debug",
		JWT_SECRET: "123",

		POSTGRES_USER: "local_user",
		POSTGRES_PASSWORD: "local_password",
		POSTGRES_DB: "taskscheduler",
		POSTGRES_HOST: "postgres",
		POSTGRES_PORT: 5432,

		REDIS_HOST: "redis",
		REDIS_PORT: "6379",

		RABBITMQ_DEFAULT_USER: "local_user",
		RABBITMQ_DEFAULT_PASS: "local_password",
		RABBITMQ_PORT: 5672,
		RABBITMQ_HOST: "rabbitmq",
		RABBITMQ_CONNECTION_STRING: "",

		EMAIL_SMTP_HOST: "mailcatcher",
		EMAIL_SMTP_PORT: 465,
		EMAIL_HTTP_HOST: "mailcatcher",
		EMAIL_HTTP_PORT: 1080,
		EMAIL_USER: "nodemailer",
		EMAIL_PASSWORD: "",
		EMAIL_FROM: "test@email.com",
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

export const mockPrisma = vi.mockObject(new PrismaClient());
