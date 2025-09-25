import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import type { Context } from "hono";
import {
  mockPrismaFindFirstEmail,
  mockPrismaFindFirstUser,
  mockPrismaUpdateEmail,
} from "../test/helpers.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";
import { deleteEmailHandler } from "./delete_email.js";

describe("Delete Email Handler", () => {
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
  const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

  it("should delete a email", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrismaFindFirstEmail(emailId, userId, "DRAFT");
    mockPrismaUpdateEmail(emailId, userId, "test", [""], "", "DRAFT");

    await deleteEmailHandler(mockHonoContext as unknown as Context);

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
    expect(mockHonoContext.body).toBeCalledWith(null, 204);
  });

  it("should return error if user not exists", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrisma.user.findFirst.mockResolvedValue(null);

    await deleteEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(expect.any(Error), 404);
  });

  it("should return error if email not exists", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrisma.email.findFirst.mockResolvedValue(null);

    await deleteEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(expect.any(Error), 404);
  });

  it("should return error if status is SCHEDULED", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrismaFindFirstEmail(emailId, userId, "SCHEDULED");

    await deleteEmailHandler(mockHonoContext as unknown as Context);

    expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
    expect(mockPrisma.email.findFirst).toBeCalledWith({
      where: { id: emailId, userId },
    });
    expect(mockHonoContext.json).toBeCalledWith(expect.any(Error), 409);
  });

  it("should return error if body don't fill schema", async () => {
    await deleteEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(expect.any(Error), 400);
  });
});
