import { beforeEach, describe, expect, it, vi } from "vitest";
import "../test/mocks.js";
import {
  mockDBFindFirstEmail,
  mockDBFindFirstUser,
  mockDBUpdateEmail,
} from "../test/helpers.js";
import { mockDBFn } from "../test/mocks.js";
import { deleteEmailHandler } from "./delete_email.js";

describe("Delete Email Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const userId = "e010b871-13d1-491c-8840-54cb93cbf7ac";
  const emailId = "40bd6098-1be4-4771-81b2-a56aff039166";

  it("should delete a email", async () => {
    mockDBFindFirstUser(userId);
    mockDBFindFirstEmail(emailId, userId, "DRAFT");
    mockDBUpdateEmail(emailId, userId, "test", [""], "", "DRAFT");

    const result = await deleteEmailHandler(
      { userId, id: emailId },
      mockDBFn.createDatabase(),
    );

    expect(mockDBFn.findFirst).toBeCalledWith(undefined, "users", {
      id: userId,
    });
    expect(mockDBFn.findFirst).toBeCalledWith(undefined, "emails", {
      id: emailId,
      user_id: userId,
    });
    expect(mockDBFn.remove).toBeCalledWith(undefined, "emails", {
      id: emailId,
      user_id: userId,
    });
    expect(result).toStrictEqual({
      result: null,
      code: 204,
    });
  });

  it("should return error if user not exists", async () => {
    mockDBFn.findFirst.mockResolvedValue(null);

    const result = await deleteEmailHandler(
      { id: emailId, userId },
      mockDBFn.createDatabase(),
    );

    expect(result).toStrictEqual({
      result: expect.any(Error),
      code: 404,
    });
  });

  it("should return error if email not exists", async () => {
    mockDBFindFirstUser(userId);
    mockDBFn.findFirst.mockResolvedValue(null);

    const result = await deleteEmailHandler(
      { id: emailId, userId },
      mockDBFn.createDatabase(),
    );

    expect(result).toStrictEqual({
      result: expect.any(Error),
      code: 404,
    });
  });

  it("should return error if body don't fill schema", async () => {
    const result = await deleteEmailHandler(
      { id: "", userId: "" },
      mockDBFn.createDatabase(),
    );

    expect(result).toStrictEqual({
      result: expect.any(Error),
      code: 400,
    });
  });
});
