import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import { mockDBFindFirstEmail, mockDBFindFirstUser } from "../test/helpers.js";
import { mockDBFn } from "../test/mocks.js";
import { getEmailHandler } from "./get_email.js";

describe("Get Email Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";
	const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

	it("should get a email", async () => {
		mockDBFindFirstUser(userId);
		mockDBFindFirstEmail(emailId, userId, "DRAFT");

		const result = await getEmailHandler(
			{ id: emailId, userId },
			mockDBFn.createDatabase(),
		);

		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "emails", {
			id: emailId,
			user_id: userId,
		});
		expect(result).toStrictEqual({
			result: expect.any(Object),
			code: 200,
		});
	});

	it("should return error if user not exists", async () => {
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await getEmailHandler(
			{ id: emailId, userId },
			mockDBFn.createDatabase(),
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});

	it("should return error if email not exists", async () => {
		mockDBFindFirstUser(userId);
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await getEmailHandler(
			{ id: emailId, userId },
			mockDBFn.createDatabase(),
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});
});
