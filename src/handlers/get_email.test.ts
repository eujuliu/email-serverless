import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEmailHandler } from "./get_email.js";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";

describe("getEmailHandler", () => {
  const userId = crypto.randomUUID();
  const emailId = crypto.randomUUID();
  const mockContext = mockHonoContext(userId, { id: emailId });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should get email successfully", async () => {
    mockContext.req.json.mockResolvedValue({});
    mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
    mockPrisma.email.findFirst.mockResolvedValue({
      id: emailId,
      userId: userId,
    });

    await getEmailHandler(mockContext as any);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(mockPrisma.email.findFirst).toHaveBeenCalledWith({
      where: { id: emailId, userId: userId },
    });
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        id: emailId,
        userId: userId,
      },
      200,
    );
  });

  it("should return 400 for invalid id", async () => {
    const mockContext = mockHonoContext(userId, {
      id: "invalid-id",
    });

    mockContext.req.json.mockResolvedValue({});

    await getEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: expect.any(String) },
      400,
    );
  });

  it("should return 404 if user not found", async () => {
    mockContext.req.json.mockResolvedValue({});
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await getEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "User not found" },
      404,
    );
  });

  it("should return 404 if email not found", async () => {
    mockContext.req.json.mockResolvedValue({});
    mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
    mockPrisma.email.findFirst.mockResolvedValue(null);

    await getEmailHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "Email not found" },
      404,
    );
  });
});
