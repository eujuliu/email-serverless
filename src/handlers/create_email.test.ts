import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import { mockDBCreateEmail, mockDBFindFirstUser } from "../test/helpers.js";
import { createEmailHandler } from "./create_email.js";
import { mockDBFn } from "../test/mocks.js";

describe("Create Email Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";
  const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

  it("should create a new email", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
      userId,
    };

    mockDBFindFirstUser(userId);
    mockDBCreateEmail(
      emailId,
      userId,
      body.subject,
      body.audience,
      body.html,
      "DRAFT",
    );

    const result = await createEmailHandler(body, mockDBFn.createDatabase());

    expect(mockDBFn.findFirst).toHaveBeenCalledWith(undefined, "users", {
      id: userId,
    });
    expect(mockDBFn.create).toHaveBeenCalledWith(undefined, "emails", {
      subject: body.subject,
      audience: body.audience,
      html: body.html,
      user_id: userId,
    });
    expect(result).toStrictEqual({
      result: expect.any(Object),
      code: 201,
    });
  });

  it("should return error if user not exists", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "Test Subject",
      html: "<p>Test HTML content</p>",
      userId,
    };
    mockDBFn.findFirst.mockResolvedValue(null);

    const result = await createEmailHandler(body, mockDBFn.createDatabase());

    expect(result).toStrictEqual({
      result: expect.any(Error),
      code: 404,
    });
  });

  it("should return error if body don't fill schema", async () => {
    const body = {
      audience: ["test@example.com", "test2@example.com"],
      subject: "",
      html: "<p>Test HTML content</p>",
      userId,
    };

    const result = await createEmailHandler(body, mockDBFn.createDatabase());

    expect(result).toStrictEqual({
      result: expect.any(Error),
      code: 400,
    });
  });
});
