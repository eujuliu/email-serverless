import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEmailHandler } from "./create_email.js";
import type { Context } from "hono";
import type { Env, JwtClaims } from "../index.js";
import { mockHonoContext, mockLogger, mockPrisma } from "../test/mocks.js";

describe("createEmailHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create email successfully", async () => {
    const body = {
      audience: ["test@example.com"],
      subject: "Test Subject",
      html: "<p>Test</p>",
    };

    (mockHonoContext.req!.json as any).mockResolvedValue(body);

    mockPrisma.user.findFirst.mockResolvedValue({
      id: "d30d037e-de9d-4214-b84a-08d70f6365d1",
    });
    mockPrisma.email.create.mockResolvedValue({
      id: "27af7955-73cc-43ef-9fa3-4e2b513b585c",
      subject: body.subject,
      audience: body.audience,
      html: body.html,
      userId: "d30d037e-de9d-4214-b84a-08d70f6365d1",
    });

    await createEmailHandler(mockHonoContext as any);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: "d30d037e-de9d-4214-b84a-08d70f6365d1" },
    });
    expect(mockPrisma.email.create).toHaveBeenCalledWith({
      data: {
        subject: body.subject,
        audience: body.audience,
        html: body.html,
        userId: "d30d037e-de9d-4214-b84a-08d70f6365d1",
      },
    });
    expect(mockHonoContext.json).toHaveBeenCalledWith(
      {
        id: "27af7955-73cc-43ef-9fa3-4e2b513b585c",
        subject: body.subject,
        audience: body.audience,
        html: body.html,
        userId: "d30d037e-de9d-4214-b84a-08d70f6365d1",
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
    (mockHonoContext.req!.json as any).mockResolvedValue(body);

    await createEmailHandler(mockHonoContext as any);

    expect(mockHonoContext.json).toHaveBeenCalledWith(
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
    (mockHonoContext.req!.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await createEmailHandler(mockHonoContext as any);

    expect(mockHonoContext.json).toHaveBeenCalledWith(
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
    (mockHonoContext.req!.json as any).mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "d30d037e-de9d-4214-b84a-08d70f6365d1",
    });
    mockPrisma.email.create.mockRejectedValue(new Error("DB Error"));

    await createEmailHandler(mockHonoContext as any);

    expect(mockLogger.error).toHaveBeenCalledWith("DB Error");
    expect(mockHonoContext.json).toHaveBeenCalledWith(
      { error: "Internal Server Error" },
      500,
    );
  });
});
