import type { PoolClient } from "pg";
import z from "zod";
import {
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { minifyZodError } from "../helpers.js";
import { findFirst, update } from "../infra/db.js";
import { logger } from "../infra/logger.js";

export const UpdateEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	audience: z.array(z.email()).min(1).optional(),
	subject: z.string().min(4).optional(),
	html: z.string().min(1).optional(),
	userId: z.uuidv4().nonoptional(),
});

export async function updateEmailHandler(
	data: z.infer<typeof UpdateEmailRequest>,
	db: PoolClient,
) {
	try {
		const result = UpdateEmailRequest.safeParse(data);

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

		const { id, audience, subject, html, userId } = result.data;

		const exists = await findFirst(db, "users", { id: userId });

		if (!exists) {
			const error = new NotFoundError({ message: "User not found" });
			return {
				result: error,
				code: error.code,
			};
		}

		const email = await findFirst(db, "emails", { id, user_id: userId });

		if (!email) {
			const error = new NotFoundError({ message: "Email not found" });
			return {
				result: error,
				code: error.code,
			};
		}

		if (email.status === "SCHEDULED") {
			const error = new ConflictError({
				message: "Cannot update a SCHEDULED email",
			});

			return {
				result: error,
				code: error.code,
			};
		}

		const updated = await update(
			db,
			"emails",
			{ id, user_id: userId },
			{
				audience,
				subject,
				html,
			},
		);

		return {
			result: updated,
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
