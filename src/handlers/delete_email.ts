import z from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "../errors/index.js";
import { logger } from "../infra/logger.js";
import { minifyZodError } from "../helpers.js";

export const DeleteEmailRequest = z.object({
  id: z.uuidv4().nonoptional(),
  userId: z.uuidv4().nonoptional(),
});

export async function deleteEmailHandler(
  data: z.infer<typeof DeleteEmailRequest>,
  prisma: PrismaClient,
) {
  try {
    const result = DeleteEmailRequest.safeParse(data);

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

    const { id, userId } = result.data;

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

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!email) {
      const error = new NotFoundError({ message: "Email not found" });
      return {
        result: error,
        code: error.code,
      };
    }

    if (email.status === "SCHEDULED") {
      const error = new ConflictError({
        message: "Cannot delete a SCHEDULED email",
      });
      return {
        result: error,
        code: error.code,
      };
    }

    await prisma.email.delete({
      where: {
        id,
        userId,
      },
    });

    return {
      result: null,
      code: 204,
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
