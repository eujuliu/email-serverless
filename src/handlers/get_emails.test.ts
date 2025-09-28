import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
	mockPrismaFindFirstUser,
	mockPrismaFindManyEmail,
} from "../test/helpers.js";
import { mockPrisma } from "../test/mocks.js";
import { getEmailsHandler } from "./get_emails.js";

describe("Get Emails Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";

	it("should get emails", async () => {
		mockPrismaFindFirstUser(userId);
		mockPrismaFindManyEmail(userId);

		const result = await getEmailsHandler(
			{ limit: 10, offset: 0, orderBy: "asc", userId },
			mockPrisma,
		);

		expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
		expect(mockPrisma.email.findMany).toBeCalledWith({
			where: {
				userId,
			},
			skip: expect.any(Number),
			take: expect.any(Number),
			orderBy: {
				updatedAt: expect.any(String),
			},
		});
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
		mockPrisma.user.findFirst.mockResolvedValue(null);

		const result = await getEmailsHandler(
			{ limit: 10, offset: 0, orderBy: "asc", userId },
			mockPrisma,
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});
});
