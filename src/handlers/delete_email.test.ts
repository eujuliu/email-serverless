import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
	mockPrismaFindFirstEmail,
	mockPrismaFindFirstUser,
	mockPrismaUpdateEmail,
} from "../test/helpers.js";
import { mockPrisma } from "../test/mocks.js";
import { deleteEmailHandler } from "./delete_email.js";

describe("Delete Email Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";
	const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

	it("should delete a email", async () => {
		mockPrismaFindFirstUser(userId);
		mockPrismaFindFirstEmail(emailId, userId, "DRAFT");
		mockPrismaUpdateEmail(emailId, userId, "test", [""], "", "DRAFT");

		const result = await deleteEmailHandler(
			{ userId, id: emailId },
			mockPrisma,
		);

		expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
		expect(mockPrisma.email.findFirst).toBeCalledWith({
			where: { id: emailId, userId },
		});
		expect(mockPrisma.email.delete).toBeCalledWith({
			where: {
				id: emailId,
				userId,
			},
		});
		expect(result).toStrictEqual({
			result: null,
			code: 204,
		});
	});

	it("should return error if user not exists", async () => {
		mockPrisma.user.findFirst.mockResolvedValue(null);

		const result = await deleteEmailHandler(
			{ id: emailId, userId },
			mockPrisma,
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});

	it("should return error if email not exists", async () => {
		mockPrismaFindFirstUser(userId);
		mockPrisma.email.findFirst.mockResolvedValue(null);

		const result = await deleteEmailHandler(
			{ id: emailId, userId },
			mockPrisma,
		);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 404,
		});
	});

	it("should return error if status is SCHEDULED", async () => {
		mockPrismaFindFirstUser(userId);
		mockPrismaFindFirstEmail(emailId, userId, "SCHEDULED");

		const result = await deleteEmailHandler(
			{ id: emailId, userId },
			mockPrisma,
		);

		expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
		expect(mockPrisma.email.findFirst).toBeCalledWith({
			where: { id: emailId, userId },
		});
		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 409,
		});
	});

	it("should return error if body don't fill schema", async () => {
		const result = await deleteEmailHandler({ id: "", userId: "" }, mockPrisma);

		expect(result).toStrictEqual({
			result: expect.any(Error),
			code: 400,
		});
	});
});
