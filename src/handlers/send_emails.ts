import type * as amqp from "amqplib";
import nodemailer from "nodemailer";
import type { Logger } from "pino";
import z from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import type { Config } from "../config.js";
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
	const handler = async (data: Record<string, string | number>) => {
		const result = SendEmailsRequest.safeParse(data);
		logger.info(`received new email with id ${data.id}`);

		if (!result.success) {
			throw new Error(z.prettifyError(result.error));
		}

		const { id: taskId, reference_id } = result.data;

		const task = await prisma.task.findFirst({
			where: { id: taskId, referenceId: reference_id },
		});

		if (!task) {
			throw new Error("task not found");
		}

		const email = await prisma.email.findFirst({ where: { id: reference_id } });

		if (!email) {
			throw new Error("email not found");
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

		const { rejectedErrors } = await transporter.sendMail({
			from: config.EMAIL_FROM,
			to: email.audience,
			subject: email.subject,
			html: email.html,
		});

		if (rejectedErrors) {
			throw new Error(rejectedErrors.join(", "));
		}

		await publish(
			channel,
			"task.result",
			"tasks",
			Buffer.from(JSON.stringify({ id: taskId, status: "COMPLETED" })),
		);

		logger.info("email sent with success!");
	};

	const onError = async (data: Record<string, string | number>, err: Error) => {
		logger.error(err);
		await publish(
			channel,
			"task.result",
			"tasks",
			Buffer.from(
				JSON.stringify({
					id: data.id,
					status: "FAILED",
					reason: err.message,
					refund: false,
				}),
			),
		);

		return false;
	};

	return await consume(channel, "email-task", handler, onError);
}
