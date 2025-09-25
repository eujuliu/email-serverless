import type { Context } from "hono";
import z from "zod";
import {
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import type { Env, JwtClaims } from "../index.js";

export const GetEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	userId: z.uuidv4().nonoptional(),
});

export async function getEmailHandler(c: Context<Env>) {
	const logger = c.get("logger");

	try {
		const claims = c.get("jwtPayload") as JwtClaims;
		const emailId = c.req.param("id");

		const result = GetEmailRequest.safeParse({
			id: emailId,
			...claims,
		});

		if (!result.success) {
			const error = new ValidationError({});
			return c.json(error, error.code);
		}

		const prisma = c.get("prisma");
		const { id, userId } = result.data;

		const exists = await prisma.user.findFirst({
			where: {
				id: userId,
			},
		});

		if (!exists) {
			const error = new NotFoundError({ message: "User not found" });
			return c.json(error, error.code);
		}

		const email = await prisma.email.findFirst({
			where: {
				id,
				userId: userId,
			},
		});

		if (!email) {
			const error = new NotFoundError({ message: "Email not found" });
			return c.json(error, error.code);
		}

		return c.json(email, 200);
	} catch (err) {
		logger.error((err as Error).message);

		const error = new InternalServerError({});

		return c.json(error, error.code);
	}
}
