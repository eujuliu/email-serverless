import type nodemailer from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool/index.js";
import z from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import {
  BaseError,
  DeliveryError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "../errors/index.js";
import { createPrismaErrorEntities, minifyZodError } from "../helpers.js";
import { logger } from "../infra/logger.js";

export const SendEmailsRequest = z.object({
  id: z.uuidv4().nonoptional(),
  reference_id: z.uuidv4().nonoptional(),
  type: z.enum(["email"]).nonoptional(),
  status: z.enum(["RUNNING"]).nonoptional(),
  from: z.email().min(1, "from is required"),
});

export async function sendEmailsHandler(
  data: z.infer<typeof SendEmailsRequest>,
  prisma: PrismaClient,
  transporter: nodemailer.Transporter<
    SMTPPool.SentMessageInfo,
    SMTPPool.Options
  >,
) {
  try {
    logger.info(`sending new email with id ${data.id}`);
    const result = SendEmailsRequest.safeParse(data);

    if (!result.success) {
      throw new ValidationError({ message: minifyZodError(result.error) });
    }

    const { id: taskId, reference_id, from } = result.data;

    const task = await prisma.task.findFirst({
      where: { id: taskId, referenceId: reference_id },
    });

    if (!task) {
      throw new NotFoundError({ message: "Task not found" });
    }

    const email = await prisma.email.findFirst({
      where: { id: reference_id },
    });

    if (!email) {
      throw new NotFoundError({ message: "Email not found" });
    }

    const transporterResult = await transporter.sendMail({
      from,
      to: email.audience,
      subject: email.subject,
      html: email.html,
    });

    if (transporterResult?.rejectedErrors) {
      const { rejected, rejectedErrors } = transporterResult;
      const relation = rejected.reduce<string[][]>((prev, crr, index) => {
        prev.push([crr, rejectedErrors[index].message ?? "Unknown error"]);

        return prev;
      }, []);

      throw new DeliveryError({ relation });
    }

    logger.info("email sent with success!");

    return { id: taskId, status: "COMPLETED" };
  } catch (err) {
    let reason = (err as Error).message;
    let refund = false;

    logger.error(reason);

    if (!(err instanceof BaseError)) {
      reason = new InternalServerError({}).message;
      refund = true;
    }

    await prisma.error.createMany({
      data: createPrismaErrorEntities(data, err as Error),
      skipDuplicates: true,
    });

    return {
      id: data.id,
      status: "FAILED",
      reason,
      refund,
    };
  }
}
