import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
  mockPrismaCreateEmail,
  mockPrismaFindFirstUser,
} from "../test/helpers.js";
import { mockHonoContext, mockPrisma } from "../test/mocks.js";
import { createEmailHandler } from "./create_email.js";
import type { Context } from "hono";

describe("Create Email Handler", () => {
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

  it("should create a new email", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);

    mockPrismaFindFirstUser(userId);
    mockPrismaCreateEmail(
      emailId,
      userId,
      body.subject,
      body.audience,
      body.html,
      "DRAFT",
    );

    await createEmailHandler(mockHonoContext as unknown as Context);

    expect(mockPrisma.user.findFirst).toBeCalledWith({ where: { id: userId } });
    expect(mockPrisma.email.create).toBeCalledWith({
      data: {
        subject: body.subject,
        audience: body.audience,
        html: body.html,
        userId,
      },
    });
    expect(mockHonoContext.json).toBeCalledWith(expect.any(Object), 201);
  });

  it("should return error if user not exists", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await createEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: "User not found",
      },
      404,
    );
  });

  it("should return error if body don't fill schema", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "",
      html: "<p>Test HTML content</p>",
    };
    mockHonoContext.req.json.mockResolvedValue(body);

    await createEmailHandler(mockHonoContext as unknown as Context);

    expect(mockHonoContext.json).toBeCalledWith(
      {
        error: expect.any(String),
      },
      400,
    );
  });
});
