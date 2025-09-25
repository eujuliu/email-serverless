import type { Context } from "hono";
import z from "zod";
import {
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import type { Env, JwtClaims } from "../index.js";

export const CreateEmailRequest = z.object({
	audience: z.array(z.string()).min(1),
	subject: z.string().min(4),
	html: z.string().min(1),
	userId: z.uuidv4().nonoptional(),
});

export async function createEmailHandler(c: Context<Env>) {
	const { logger } = c.var;

	try {
		const prisma = c.get("prisma");
		const claims = c.get("jwtPayload") as JwtClaims;
		const body = await c.req.json();
		const result = CreateEmailRequest.safeParse({ ...claims, ...body });

		if (!result.success) {
			const error = new ValidationError({});
			return c.json(error, error.code);
		}

		const { userId, subject, audience, html } = result.data;

		const exists = await prisma.user.findFirst({
			where: {
				id: userId,
			},
		});

		if (!exists) {
			const error = new NotFoundError({ message: "User not found" });
			return c.json(error, error.code);
		}

		const email = await prisma.email.create({
			data: {
				subject,
				audience,
				html,
				userId,
			},
		});

		return c.json(email, 201);
	} catch (err) {
		logger.error((err as Error).message);

		const error = new InternalServerError({});

		return c.json(error, error.code);
	}
}
