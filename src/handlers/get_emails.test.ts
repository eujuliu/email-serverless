import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import type { Context } from "hono";
import {
	mockPrismaFindFirstUser,
	mockPrismaFindManyEmail,
} from "../test/helpers.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";
import { getEmailsHandler } from "./get_emails.js";

describe("Get Emails Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();

		mockHonoContext.get.mockImplementation((key: "prisma" | "jwtPayload") => {
			const values = {
				prisma: mockPrisma,
				jwtPayload: {
					userId,
				},
			};

			return values[key];
		});
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";

	it("should get emails", async () => {
		mockPrismaFindFirstUser(userId);
		mockPrismaFindManyEmail(userId);

		await getEmailsHandler(mockHonoContext as unknown as Context);

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
		expect(mockHonoContext.json).toBeCalledWith(
			{
				emails: expect.any(Array),
				pagination: {
					offset: expect.any(Number),
					limit: expect.any(Number),
					orderBy: expect.any(String),
					total: expect.any(Number),
				},
			},
			200,
		);
	});

	it("should return error if user not exists", async () => {
		mockPrisma.user.findFirst.mockResolvedValue(null);

		await getEmailsHandler(mockHonoContext as unknown as Context);

		expect(mockHonoContext.json).toBeCalledWith(expect.any(Error), 404);
	});
});
