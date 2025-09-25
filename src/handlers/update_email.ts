import type { Context } from "hono";
import z from "zod";
import {
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import type { Env, JwtClaims } from "../index.js";

export const UpdateEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	audience: z.array(z.string()).min(1).optional(),
	subject: z.string().min(4).optional(),
	html: z.string().min(1).optional(),
	userId: z.uuidv4().nonoptional(),
});

export async function updateEmailHandler(c: Context<Env>) {
	const logger = c.get("logger");

	try {
		const claims = c.get("jwtPayload") as JwtClaims;
		const emailId = c.req.param("id");
		const body = await c.req.json();

		const result = UpdateEmailRequest.safeParse({
			id: emailId,
			...body,
			...claims,
		});

		if (!result.success) {
			const error = new ValidationError({});
			return c.json(error, error.code);
		}

		const prisma = c.get("prisma");
		const { id, audience, subject, html, userId } = result.data;

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
				userId,
			},
		});

		if (!email) {
			const error = new NotFoundError({ message: "Email not found" });
			return c.json(error, error.code);
		}

		if (email.status === "SCHEDULED") {
			const error = new ConflictError({
				message: "Cannot update a SCHEDULED email",
			});
			return c.json(error, error.code);
		}

		const updated = await prisma.email.update({
			where: {
				id: emailId,
			},
			data: {
				audience,
				subject,
				html,
			},
		});

		return c.json(updated, 200);
	} catch (err) {
		logger.error((err as Error).message);

		const error = new InternalServerError({});

		return c.json(error, error.code);
	}
}
