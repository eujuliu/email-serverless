import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
  mockPrismaFindFirstUser,
  mockPrismaFindFirstEmail,
} from "../test/helpers.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";
import { getEmailHandler } from "./get_email.js";
import type { Context } from "hono";

describe("Get Email Handler", () => {
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

  it("should get a email", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrismaFindFirstEmail(emailId, userId, "DRAFT");

    await getEmailHandler(mockHonoContext as unknown as Context);

    expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
    expect(mockPrisma.email.findFirst).toBeCalledWith({
      where: { id: emailId, userId },
    });
    expect(mockHonoContext.json).toBeCalledWith(expect.any(Object), 200);
  });

  it("should return error if user not exists", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrisma.user.findFirst.mockResolvedValue(null);

    await getEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "User not found",
      },
      404,
    );
  });

  it("should return error if email not exists", async () => {
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrisma.email.findFirst.mockResolvedValue(null);

    await getEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "Email not found",
      },
      404,
    );
  });
});
