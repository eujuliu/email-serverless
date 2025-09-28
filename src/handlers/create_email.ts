import type { PrismaClient } from "@prisma/client/extension";
import z from "zod";
import {
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "../errors/index.js";
import { logger } from "../infra/logger.js";
import { minifyZodError } from "../helpers.js";

export const CreateEmailRequest = z.object({
  audience: z.array(z.email()).min(1),
  subject: z.string().min(4),
  html: z.string().min(1),
  userId: z.uuidv4().nonoptional(),
});

export async function createEmailHandler(
  request: z.infer<typeof CreateEmailRequest>,
  prisma: PrismaClient,
) {
  try {
    logger.info("create email handler started...");
    const result = CreateEmailRequest.safeParse(request);

    if (!result.success) {
      const error = new ValidationError({
        message: minifyZodError(result.error),
      });

      logger.error(error.message);

      return {
        result: error,
        code: error.code,
      };
    }

    const { userId, subject, audience, html } = result.data;

    const exists = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!exists) {
      const error = new NotFoundError({ message: "User not found" });
      return {
        result: error,
        code: error.code,
      };
    }

    const email = await prisma.email.create({
      data: {
        subject,
        audience,
        html,
        userId,
      },
    });

    logger.info("create email handler finished...");
    return {
      result: email,
      code: 201,
    };
  } catch (err) {
    logger.error((err as Error).message);

    const error = new InternalServerError({});

    return {
      result: error,
      code: error.code,
    };
  }
}
