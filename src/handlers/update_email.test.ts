import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";
import {
  mockPrismaFindFirstUser,
  mockPrismaFirstFirstEmail,
  mockPrismaUpdateEmail,
} from "../test/helpers.js";
import { updateEmailHandler } from "./update_email.js";

describe("Update Email Handler", () => {
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

  it("should update a email", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com", "test2@example.com"],
      subject: "Test Subject 1",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrismaFirstFirstEmail(emailId, userId, "DRAFT");
    mockPrismaUpdateEmail(
      emailId,
      userId,
      body.subject,
      body.audience,
      body.html,
      "DRAFT",
    );

    await updateEmailHandler(mockHonoContext as any);

    expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
    expect(mockPrisma.email.findFirst).toBeCalledWith({
      where: { id: emailId, userId },
    });
    expect(mockPrisma.email.update).toBeCalledWith({
      where: {
        id: emailId,
      },
      data: {
        ...body,
      },
    });
    expect(mockHonoContext.json).toBeCalledWith(expect.any(Object), 200);
  });

  it("should return error if user not exists", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrisma.user.findFirst.mockResolvedValue(null);

    await updateEmailHandler(mockHonoContext as any);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "User not found",
      },
      404,
    );
  });

  it("should return error if email not exists", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrisma.email.findFirst.mockResolvedValue(null);

    await updateEmailHandler(mockHonoContext as any);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "Email not found",
      },
      404,
    );
  });

  it("should return error if status is SCHEDULED", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com", "test2@example.com"],
      subject: "Test Subject 1",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockHonoContext.req.param.mockReturnValue(emailId);

    mockPrismaFindFirstUser(userId);
    mockPrismaFirstFirstEmail(emailId, userId, "SCHEDULED");

    await updateEmailHandler(mockHonoContext as any);

    expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
    expect(mockPrisma.email.findFirst).toBeCalledWith({
      where: { id: emailId, userId },
    });
    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "Cannot update a scheduled email",
      },
      400,
    );
  });

  it("should return error if body don't fill schema", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockHonoContext.req.param.mockReturnValue(emailId);

    await updateEmailHandler(mockHonoContext as any);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: expect.any(String),
      },
      400,
    );
  });
});
