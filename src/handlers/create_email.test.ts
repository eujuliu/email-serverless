import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEmailHandler } from "./create_email.js";
import type { Context } from "hono";
import type { Env, JwtClaims } from "../index.js";
import { mockHonoContext, mockLogger, mockPrisma } from "../test/mocks.js";

describe("createEmailHandler", () => {
  const userId = crypto.randomUUID();
  const emailId = crypto.randomUUID();
  const mockContext = mockHonoContext(userId, { id: emailId });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create email successfully", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };

    (mockContext.req.json as any).mockResolvedValue(body);

    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.create.mockResolvedValue({
      id: emailId,
      subject: body.subject,
      audience: body.audience,
      html: body.html,
      userId: userId,
    });

    await createEmailHandler(mockContext as any);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(mockPrisma.email.create).toHaveBeenCalledWith({
      data: {
        subject: body.subject,
        audience: body.audience,
        html: body.html,
        userId: userId,
      },
    });
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        id: emailId,
        subject: body.subject,
        audience: body.audience,
        html: body.html,
        userId: userId,
      },
      201,
    );
  });

  it("should return 400 for invalid request body", async () => {
    const body = {
      audience: [],
      subject: "Hi",
      html: "",
    };
    (mockContext.req!.json as any).mockResolvedValue(body);

    await createEmailHandler(mockContext as any);

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
    (mockContext.req!.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await createEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "User not found" },
      404,
    );
  });

  it("should return 500 on database error", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };
    (mockContext.req!.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
    });
    mockPrisma.email.create.mockRejectedValue(new Error("DB Error"));

    await createEmailHandler(mockContext as any);

    expect(mockLogger.error).toHaveBeenCalledWith("DB Error");
    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Internal Server Error" },
      500,
    );
  });
});
