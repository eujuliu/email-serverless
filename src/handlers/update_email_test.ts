import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateEmailHandler, UpdateEmailRequest } from "./update_email.js";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { mockHonoContext, mockPrisma, mockLogger } from "../test/mocks.js";

describe("updateEmailHandler", () => {
  const userId = crypto.randomUUID();
  const emailId = crypto.randomUUID();
  const mockContext = mockHonoContext(userId, { id: emailId });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should update email successfully", async () => {
    const body = {
      audience: ["updated@example.com"],
      subject: "Updated Subject",
      html: "<p>Updated</p>",
    };
    (mockContext.req.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.findFirst.mockResolvedValue({
      id: emailId,
      status: "DRAFT",
      userId: userId,
    });
    mockPrisma.email.update.mockResolvedValue({
      id: emailId,
      audience: body.audience,
      subject: body.subject,
      html: body.html,
      userId: userId,
    });

    await updateEmailHandler(mockContext as any);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
      where: { id: emailId, userId: userId },
    });
    expect(mockPrisma.email.update).toHaveBeenCalledWith({
      where: { id: emailId },
      data: {
        audience: body.audience,
        subject: body.subject,
        html: body.html,
      },
    });
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        id: emailId,
        audience: body.audience,
        subject: body.subject,
        html: body.html,
        userId: userId,
      },
      200,
    );
  });

  it("should return 400 for invalid request body", async () => {
    const body = {
      audience: [],
      subject: "Hi",
    };
    (mockContext.req.json as any).mockResolvedValue(body);

    await updateEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: expect.any(String) },
      400,
    );
  });

  it("should return 404 if user not found", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };
    (mockContext.req.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await updateEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "User not found" },
      404,
    );
  });

  it("should return 404 if email not found", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };
    (mockContext.req.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.findFirst.mockResolvedValue(null);

    await updateEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Email not found" },
      404,
    );
  });

  it("should return 400 if email is scheduled", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };
    (mockContext.req.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.findFirst.mockResolvedValue({
      id: emailId,
      status: "SCHEDULED",
      userId: userId,
    });

    await updateEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Cannot update a scheduled email" },
      400,
    );
  });

  it("should return 500 on database error", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };
    (mockContext.req.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.findFirst.mockResolvedValue({
      id: emailId,
      status: "DRAFT",
      userId: userId,
    });
    mockPrisma.email.update.mockRejectedValue(new Error("DB Error"));

    await updateEmailHandler(mockContext as any);

    expect(mockLogger.error).toHaveBeenCalledWith("DB Error");
    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Internal Server Error" },
      500,
    );
  });
});
