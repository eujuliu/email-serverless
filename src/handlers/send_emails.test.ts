import "../test/mocks.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTransporter } from "../infra/email.js";
import {
	mockPrismaFindFirstEmail,
	mockPrismaFindFirstTask,
} from "../test/helpers.js";
import { mockConfig, mockPrisma } from "../test/mocks.js";
import { sendEmailsHandler } from "./send_emails.js";

describe("Send Emails", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const taskId = crypto.randomUUID();
	const emailId = crypto.randomUUID();
	const userId = crypto.randomUUID();
	const mockTransporter = vi.mockObject(createTransporter(mockConfig));

	const data = {
		id: taskId,
		reference_id: emailId,
		type: "email" as "email",
		status: "RUNNING" as "RUNNING",
		userId,
		from: "email@test.com",
	};

	it("should send email", async () => {
		mockPrismaFindFirstTask(taskId, emailId);
		mockPrismaFindFirstEmail(emailId, userId, "DRAFT");

		const result = await sendEmailsHandler(data, mockPrisma, mockTransporter);
		expect(mockTransporter.sendMail).toHaveBeenCalledWith({
			from: data.from,
			to: [""],
			subject: "",
			html: "",
		});
		expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
			where: { id: data.id, referenceId: data.reference_id },
		});
		expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
			where: { id: data.reference_id },
		});
		expect(result).toStrictEqual({ id: taskId, status: "COMPLETED" });
	});

	it("should handle task not found error", async () => {
		mockPrisma.task.findFirst.mockResolvedValue(null);
		mockPrisma.error.createMany.mockResolvedValue({ count: 1 });

		const result = await sendEmailsHandler(data, mockPrisma, mockTransporter);

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
		expect(result).toStrictEqual({
			id: data.id,
			status: "FAILED",
			reason: expect.any(String),
			refund: expect.any(Boolean),
		});
	});

	it("should handle email not found error", async () => {
		mockPrismaFindFirstTask(taskId, emailId);
		mockPrisma.email.findFirst.mockResolvedValue(null);
		mockPrisma.error.createMany.mockResolvedValue({ count: 1 });

		const result = await sendEmailsHandler(data, mockPrisma, mockTransporter);

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
		expect(result).toStrictEqual({
			id: data.id,
			status: "FAILED",
			reason: expect.any(String),
			refund: expect.any(Boolean),
		});
	});
});
