import type { PoolClient } from "pg";
import z from "zod";
import {
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { minifyZodError } from "../helpers.js";
import { count, findFirst, findMany } from "../infra/db.js";
import { logger } from "../infra/logger.js";

export const GetEmailsRequest = z.object({
	userId: z.uuidv4().nonoptional(),
	offset: z.preprocess((val) => Number(val), z.number()).default(0),
	limit: z
		.preprocess((val) => Number(val), z.number().min(10).max(100))
		.default(10),
	orderBy: z.enum(["ASC", "DESC"]).default("ASC"),
});

export async function getEmailsHandler(
	data: z.infer<typeof GetEmailsRequest>,
	db: PoolClient,
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

		const exists = await findFirst(db, "users", { id: userId });

		if (!exists) {
			const error = new NotFoundError({ message: "User not found" });
			return {
				result: error,
				code: error.code,
			};
		}

		const emails = await findMany(
			db,
			"emails",
			{ user_id: userId },
			offset,
			limit,
			orderBy,
		);

		const total = await count(db, "emails", { user_id: userId });

		logger.info("get emails handler finished...");
		return {
			result: {
				emails,
				pagination: {
					offset,
					limit,
					orderBy,
					total,
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
