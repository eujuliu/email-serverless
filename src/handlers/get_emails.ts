import z from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import {
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "../errors/index.js";
import { logger } from "../infra/logger.js";
import { minifyZodError } from "../helpers.js";

export const GetEmailsRequest = z.object({
  userId: z.uuidv4().nonoptional(),
  offset: z.preprocess((val) => Number(val), z.number()).default(0),
  limit: z
    .preprocess((val) => Number(val), z.number().min(10).max(100))
    .default(10),
  orderBy: z.enum(["asc", "desc"]).default("asc"),
});

export async function getEmailsHandler(
  data: z.infer<typeof GetEmailsRequest>,
  prisma: PrismaClient,
) {
  try {
    logger.info("get emails handler started...");
    const result = GetEmailsRequest.safeParse(data);

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

    const { userId, offset, limit, orderBy } = result.data;

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

    const emails = await prisma.email.findMany({
      where: {
        userId,
      },
      skip: offset,
      take: limit,
      orderBy: {
        updatedAt: orderBy,
      },
    });
    const count = await prisma.email.count({ where: { userId } });

    logger.info("get emails handler finished...");
    return {
      result: {
        emails,
        pagination: {
          offset,
          limit,
          orderBy,
          total: count,
        },
      },
      code: 200,
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
