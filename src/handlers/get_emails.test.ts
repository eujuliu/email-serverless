import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import { mockDBFindFirstUser, mockDBFindManyEmail } from "../test/helpers.js";
import { mockDBFn } from "../test/mocks.js";
import { getEmailsHandler } from "./get_emails.js";

describe("Get Emails Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";

	it("should get emails", async () => {
		mockDBFindFirstUser(userId);
		mockDBFindManyEmail(userId);

		const result = await getEmailsHandler(
			{ limit: 10, offset: 0, orderBy: "ASC", userId },
			mockDBFn.createDatabase(),
		);

		expect(mockDBFn.findFirst).toBeCalledWith(undefined, "users", {
			id: userId,
		});
		expect(mockDBFn.findMany).toBeCalledWith(
			undefined,
			"emails",
			{ user_id: userId },
			expect.any(Number),
			expect.any(Number),
			expect.any(String),
		);
		expect(result).toStrictEqual({
			result: {
				emails: expect.any(Array),
				pagination: {
					offset: expect.any(Number),
					limit: expect.any(Number),
					orderBy: expect.any(String),
					total: expect.any(Number),
				},
			},
			code: 200,
		});
	});

	it("should return error if user not exists", async () => {
		mockDBFn.findFirst.mockResolvedValue(null);

		const result = await getEmailsHandler(
			{ limit: 10, offset: 0, orderBy: "ASC", userId },
			mockDBFn.createDatabase(),
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});
});
