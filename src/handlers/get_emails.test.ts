import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEmailsHandler } from "./get_emails.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";

describe("getEmailsHandler", () => {
  const userId = crypto.randomUUID();
  const mockContext = mockHonoContext(userId, {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get emails successfully with defaults", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
    mockPrisma.email.findMany.mockResolvedValue([{ id: "email-1", userId }]);
    mockPrisma.email.count.mockResolvedValue(1);

    await getEmailsHandler(mockContext as any);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(mockPrisma.email.findMany).toHaveBeenCalledWith({
      where: { userId },
      skip: 0,
      take: 10,
      orderBy: { updatedAt: "asc" },
    });
    expect(mockPrisma.email.count).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        emails: [{ id: "email-1", userId }],
        pagination: {
          offset: 0,
          limit: 10,
          orderBy: "asc",
          total: 1,
        },
      },
      200,
    );
  });

  it("should return 400 for invalid params", async () => {
    const context = mockHonoContext(userId, {
      limit: "5",
    });

    await getEmailsHandler(context as any);

    expect(context.json).toHaveBeenCalledWith(
      { error: expect.any(String) },
      400,
    );
  });

  it("should return 404 if user not found", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await getEmailsHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: "User not found" },
      404,
    );
  });
});
