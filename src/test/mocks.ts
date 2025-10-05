import { vi } from "vitest";
import { createConfig } from "../config.js";
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

export const mockDBFn = {
	createDatabase: vi.fn(),
	findFirst: vi.fn(),
	findMany: vi.fn(),
	create: vi.fn(),
	createMany: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
	count: vi.fn(),
};

vi.mock("../infra/db", () => mockDBFn);

export const mockConfig = vi.mocked(createConfig(process.env));

export const mockRabbitMq = vi.mocked(await createRabbitMQ(mockConfig));
