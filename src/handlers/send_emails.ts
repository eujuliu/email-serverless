import type nodemailer from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool/index.js";
import type { PoolClient } from "pg";
import z from "zod";
import {
	BaseError,
	ConflictError,
	DeliveryError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { minifyZodError } from "../helpers.js";
import { findFirst } from "../infra/db.js";
import { logger } from "../infra/logger.js";

export const SendEmailsRequest = z.object({
	id: z.uuidv4().min(1, "id is required"),
	from: z.email().default('"Test Email" test@email.com'),
	user_id: z.uuidv4().min(1, "user_id is required"),
});

export async function sendEmailsHandler(
	data: z.infer<typeof SendEmailsRequest>,
	db: PoolClient,
	transporter: nodemailer.Transporter<
		SMTPPool.SentMessageInfo,
		SMTPPool.Options
	>,
) {
	try {
		const result = SendEmailsRequest.safeParse(data);

		if (!result.success) {
			throw new ValidationError({ message: minifyZodError(result.error) });
		}

		logger.info(`sending new email with id ${data.id}`);

		const { id: taskId, user_id, from } = result.data;

		const user = await findFirst(db, "users", {
			id: user_id,
		});

		if (!user) {
			throw new NotFoundError({ message: "User not found" });
		}

		const task = await findFirst(db, "tasks", {
			id: taskId,
		});

		if (!task) {
			throw new NotFoundError({ message: "Task not found" });
		}

		if (task.status !== "RUNNING") {
			throw new ConflictError({ message: "Task is not running" });
		}

		if (task.type !== "email") {
			throw new ConflictError({ message: "Task is not for email" });
		}

		const email = await findFirst(db, "emails", {
			id: task.reference_id,
			user_id: task.user_id,
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

		logger.error(err);

		if (err instanceof ValidationError) {
			refund = true;
			reason = "A validation error happens";
		}

		if (!(err instanceof BaseError)) {
			reason = new InternalServerError({}).message;
			refund = true;
		}

		return {
			id: data.id,
			status: "FAILED",
			reason,
			refund,
		};
	}
}
