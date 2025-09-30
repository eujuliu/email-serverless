import type { PoolClient } from "pg";
import z from "zod";
import {
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { minifyZodError } from "../helpers.js";
import { findFirst } from "../infra/db.js";
import { logger } from "../infra/logger.js";

export const GetEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	userId: z.uuidv4().nonoptional(),
});

export async function getEmailHandler(
	data: z.infer<typeof GetEmailRequest>,
	db: PoolClient,
) {
	try {
		logger.info("get email handler started...");
		const result = GetEmailRequest.safeParse(data);

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

		logger.info("get email handler finished...");
		return {
			result: email,
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
