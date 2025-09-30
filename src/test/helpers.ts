import { mockDBFn } from "./mocks.js";

export function mockDBFindFirstUser(id: string) {
  mockDBFn.findFirst.mockResolvedValueOnce({
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    credits: 0,
    frozenCredits: 0,
    email: "",
    password: "",
    username: "",
  });
}

export function mockDBFindFirstEmail(
  id: string,
  user_id: string,
  status: "DRAFT" | "SCHEDULED",
) {
  mockDBFn.findFirst.mockResolvedValueOnce({
    id,
    subject: "",
    audience: [""],
    html: "",
    user_id,
    createdAt: new Date(),
    updatedAt: new Date(),
    status,
  });
}

export function mockDBFindManyEmail(user_id: string) {
  mockDBFn.count.mockResolvedValueOnce(2);
  mockDBFn.findMany.mockResolvedValueOnce([
    {
      id: crypto.randomUUID(),
      subject: "test 1",
      audience: [""],
      html: "",
      user_id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "DRAFT",
    },
    {
      id: crypto.randomUUID(),
      subject: "test 2",
      audience: [""],
      html: "",
      user_id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "SCHEDULED",
    },
  ]);
}

export function mockDBCreateEmail(
  id: string,
  user_id: string,
  subject: string,
  audience: string[],
  html: string,
  status: "DRAFT" | "SCHEDULED",
) {
  mockDBFn.create.mockResolvedValueOnce({
    id,
    subject,
    audience,
    html,
    user_id,
    createdAt: new Date(),
    updatedAt: new Date(),
    status,
  });
}

export function mockDBUpdateEmail(
  id: string,
  user_id: string,
  subject: string,
  audience: string[],
  html: string,
  status: "DRAFT" | "SCHEDULED",
) {
  mockDBFn.update.mockResolvedValueOnce({
    id,
    subject,
    audience,
    html,
    user_id,
    createdAt: new Date(),
    updatedAt: new Date(),
    status,
  });
}

export function mockDBFindFirstTask(
  id: string,
  referenceId: string,
  user_id: string,
) {
  mockDBFn.findFirst.mockResolvedValueOnce({
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    cost: 10,
    type: "email",
    priority: 1,
    user_id,
    runAt: new Date(),
    timezone: "",
    idempotencyKey: "",
    referenceId,
    retries: 0,
    status: "RUNNING",
  });
}
