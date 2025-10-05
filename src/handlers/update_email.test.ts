import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
	mockDBFindFirstEmail,
	mockDBFindFirstUser,
	mockDBUpdateEmail,
} from "../test/helpers.js";
import { mockDBFn } from "../test/mocks.js";
import { updateEmailHandler } from "./update_email.js";

describe("Update Email Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";
	const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

	it("should update a email", async () => {
		const body = {
			audience: ["test@example.com", "test2@example.com", "test2@example.com"],
			subject: "Test Subject 1",
			html: "<p>Test HTML content</p>",
			id: emailId,
			userId,
		};

		mockDBFindFirstUser(userId);
		mockDBFindFirstEmail(emailId, userId, "DRAFT");
		mockDBUpdateEmail(
			emailId,
			userId,
			body.subject,
			body.audience,
			body.html,
			"DRAFT",
		);

		const result = await updateEmailHandler(body, mockDBFn.createDatabase());

		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "emails", {
			id: emailId,
			user_id: userId,
		});
		expect(mockDBFn.update).toBeCalledWith(
			undefined,
			"emails",
			{ id: emailId, user_id: userId },
			{
				audience: body.audience,
				subject: body.subject,
				html: body.html,
			},
		);
		expect(result).toStrictEqual({
			result: expect.any(Object),
			code: 200,
		});
	});

	it("should return error if user not exists", async () => {
		const body = {
			audience: ["test@example.com", "test2@example.com"],
			subject: "Test Subject",
			html: "<p>Test HTML content</p>",
			id: emailId,
			userId,
		};

		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await updateEmailHandler(body, mockDBFn.createDatabase());

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});

	it("should return error if email not exists", async () => {
		const body = {
			audience: ["test@example.com", "test2@example.com"],
			subject: "Test Subject",
			html: "<p>Test HTML content</p>",
			id: emailId,
			userId,
		};

		mockDBFindFirstUser(userId);
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await updateEmailHandler(body, mockDBFn.createDatabase());

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});

	it("should return error if status is SCHEDULED", async () => {
		const body = {
			audience: ["test@example.com", "test2@example.com", "test2@example.com"],
			subject: "Test Subject 1",
			html: "<p>Test HTML content</p>",
			id: emailId,
			userId,
		};

		mockDBFindFirstUser(userId);
		mockDBFindFirstEmail(emailId, userId, "SCHEDULED");

		const result = await updateEmailHandler(body, mockDBFn.createDatabase());

		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "emails", {
			id: emailId,
			user_id: userId,
		});
		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 409,
		});
	});

	it("should return error if body don't fill schema", async () => {
		const body = {
			audience: ["test@example.com", "test2@example.com"],
			subject: "",
			html: "<p>Test HTML content</p>",
			id: emailId,
			userId,
		};

		const result = await updateEmailHandler(body, mockDBFn.createDatabase());

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 400,
		});
	});
});
