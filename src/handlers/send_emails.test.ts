import "../test/mocks.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTransporter } from "../infra/email.js";
import {
	mockDBFindFirstEmail,
	mockDBFindFirstTask,
	mockDBFindFirstUser,
} from "../test/helpers.js";
import { mockConfig, mockDBFn } from "../test/mocks.js";
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
		user_id: userId,
		from: "email@test.com",
	};

	it("should send email", async () => {
		mockDBFindFirstUser(userId);
		mockDBFindFirstTask(taskId, emailId, userId);
		mockDBFindFirstEmail(emailId, userId, "SCHEDULED");

		const result = await sendEmailsHandler(
			data,
			mockDBFn.createDatabase(),
			mockTransporter,
		);

		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "tasks", {
			id: taskId,
		});

		expect(mockTransporter.sendMail).toHaveBeenCalledWith({
			from: data.from,
			to: [""],
			subject: "",
			html: "",
		});
		expect(result).toStrictEqual({ id: taskId, status: "COMPLETED" });
	});

	it("should handle task not found error", async () => {
		mockDBFindFirstUser(userId);
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await sendEmailsHandler(
			data,
			mockDBFn.createDatabase(),
			mockTransporter,
		);

		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "tasks", {
			id: taskId,
		});
		expect(result).toStrictEqual({
			id: data.id,
			status: "FAILED",
			reason: expect.any(String),
			refund: expect.any(Boolean),
		});
	});

	it("should handle email not found error", async () => {
		mockDBFindFirstUser(userId);
		mockDBFindFirstTask(taskId, emailId, userId);
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await sendEmailsHandler(
			data,
			mockDBFn.createDatabase(),
			mockTransporter,
		);

		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "tasks", {
			id: taskId,
		});
		expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "emails", {
			id: emailId,
			user_id: userId,
		});
		expect(result).toStrictEqual({
			id: data.id,
			status: "FAILED",
			reason: expect.any(String),
			refund: expect.any(Boolean),
		});
	});
});
