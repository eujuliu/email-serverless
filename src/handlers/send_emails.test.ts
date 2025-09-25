import "../test/mocks.js";

import { pino } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initializeConfig } from "../config.js";
import { consume, publish } from "../infra/rabbitmq.js";
import {
	mockPrismaFindFirstEmail,
	mockPrismaFindFirstTask,
} from "../test/helpers.js";
import { mockPrisma, mockRabbitMq } from "../test/mocks.js";
import { sendEmailsHandler } from "./send_emails.js";

describe("Send Emails", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const logger = pino();
	const config = initializeConfig(logger);

	const taskId = crypto.randomUUID();
	const emailId = crypto.randomUUID();
	const userId = crypto.randomUUID();

	const data: Record<string, string | number> = {
		id: crypto.randomUUID(),
		reference_id: crypto.randomUUID(),
		type: "email",
		status: "RUNNING",
		userId: "user-uuid",
	};

	it("should send email", async () => {
		mockPrismaFindFirstEmail(emailId, userId, "DRAFT");
		mockPrismaFindFirstTask(taskId, emailId);

		vi.mocked(publish).mockResolvedValue();

		vi.mocked(consume).mockImplementation(
			async (_c, _q, handler) => await handler(data),
		);

		await sendEmailsHandler(logger, config, mockPrisma, mockRabbitMq.channel);
		expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
			where: { id: data.id, referenceId: data.reference_id },
		});
		expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
			where: { id: data.reference_id },
		});
		expect(publish).toHaveBeenCalledWith(
			mockRabbitMq.channel,
			"task.result",
			"tasks",
			expect.any(Buffer),
		);
	});

	it("should handle task not found error", async () => {
		mockPrisma.task.findFirst.mockResolvedValue(null);
		mockPrisma.error.createMany.mockResolvedValue({ count: 1 });
		vi.mocked(publish).mockResolvedValue();

		vi.mocked(consume).mockImplementation(
			async (_c, _q, handler) => await handler(data),
		);

		await sendEmailsHandler(logger, config, mockPrisma, mockRabbitMq.channel);

		expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
			where: { id: data.id, referenceId: data.reference_id },
		});
		expect(mockPrisma.error.createMany).toHaveBeenCalledWith({
			data: [
				{
					reason: "Task not found",
					type: "email",
					referenceId: data.id,
					userId: data.userId,
				},
			],
			skipDuplicates: true,
		});
		expect(publish).toHaveBeenCalledWith(
			mockRabbitMq.channel,
			"task.result",
			"tasks",
			expect.any(Buffer),
		);
	});

	it("should handle email not found error", async () => {
		mockPrismaFindFirstTask(taskId, emailId);
		mockPrisma.email.findFirst.mockResolvedValue(null);
		mockPrisma.error.createMany.mockResolvedValue({ count: 1 });
		vi.mocked(publish).mockResolvedValue();

		vi.mocked(consume).mockImplementation(
			async (_c, _q, handler) => await handler(data),
		);

		await sendEmailsHandler(logger, config, mockPrisma, mockRabbitMq.channel);

		expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
			where: { id: data.id, referenceId: data.reference_id },
		});
		expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
			where: { id: data.reference_id },
		});
		expect(mockPrisma.error.createMany).toHaveBeenCalledWith({
			data: [
				{
					reason: "Email not found",
					type: "email",
					referenceId: data.id,
					userId: data.userId,
				},
			],
			skipDuplicates: true,
		});
		expect(publish).toHaveBeenCalledWith(
			mockRabbitMq.channel,
			"task.result",
			"tasks",
			expect.any(Buffer),
		);
	});
});
