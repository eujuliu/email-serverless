import type * as amqp from "amqplib";
import nodemailer from "nodemailer";
import type { Logger } from "pino";
import z from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import type { Config } from "../config.js";
import {
	BaseError,
	DeliveryError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { createPrismaErrorEntities } from "../helpers.js";
import { consume, publish } from "../infra/rabbitmq.js";

const SendEmailsRequest = z.object({
	id: z.uuidv4().nonoptional(),
	reference_id: z.uuidv4().nonoptional(),
	type: z.enum(["email"]).nonoptional(),
	status: z.enum(["RUNNING"]).nonoptional(),
});

export async function sendEmailsHandler(
	logger: Logger,
	config: Config,
	prisma: PrismaClient,
	channel: amqp.Channel,
) {
	await consume(channel, "email-task", async (data) => {
		try {
			const result = SendEmailsRequest.safeParse(data);
			logger.info(`received new email with id ${data.id}`);

			if (!result.success) {
				throw new ValidationError({});
			}

			const { id: taskId, reference_id } = result.data;

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

			const transporter = nodemailer.createTransport({
				host: config.EMAIL_SMTP_HOST,
				secure: !!config.NODE_ENV.match(/prod/),
				auth: {
					user: config.EMAIL_USER,
					pass: config.EMAIL_PASSWORD,
				},
				pool: true,
			});

			const { rejected, rejectedErrors } = await transporter.sendMail({
				from: config.EMAIL_FROM,
				to: email.audience,
				subject: email.subject,
				html: email.html,
			});

			if (rejected && rejectedErrors) {
				const relation = rejected.reduce<string[][]>((prev, crr, index) => {
					prev.push([crr, rejectedErrors[index].message ?? "Unknown error"]);

					return prev;
				}, []);

				throw new DeliveryError({ relation });
			}

			await publish(
				channel,
				"task.result",
				"tasks",
				Buffer.from(JSON.stringify({ id: taskId, status: "COMPLETED" })),
			);

			logger.info("email sent with success!");
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

			await publish(
				channel,
				"task.result",
				"tasks",
				Buffer.from(
					JSON.stringify({
						id: data.id,
						status: "FAILED",
						reason,
						refund,
					}),
				),
			);
		}
	});
}
