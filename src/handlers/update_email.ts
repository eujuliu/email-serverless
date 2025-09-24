import type { Context } from "hono";
import z from "zod";
import type { Env, JwtClaims } from "../index.js";

export const UpdateEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	audience: z.array(z.string()).min(1).optional(),
	subject: z.string().min(4).optional(),
	html: z.string().min(1).optional(),
	userId: z.uuidv4().nonoptional(),
});

export async function updateEmailHandler(c: Context<Env>) {
	const claims = c.get("jwtPayload") as JwtClaims;
	const emailId = c.req.param("id");
	const body = await c.req.json();

	const result = UpdateEmailRequest.safeParse({
		id: emailId,
		...body,
		...claims,
	});

	if (!result.success) {
		return c.json(
			{
				error: result.error.message,
			},
			400,
		);
	}

	const { logger } = c.var;
	const prisma = c.get("prisma");
	const { id, audience, subject, html, userId } = result.data;

	const exists = await prisma.user.findFirst({
		where: {
			id: userId,
		},
	});

	if (!exists) {
		return c.json(
			{
				error: "User not found",
			},
			404,
		);
	}

	const email = await prisma.email.findFirst({
		where: {
			id,
			userId,
		},
	});

	if (!email) {
		return c.json(
			{
				error: "Email not found",
			},
			404,
		);
	}

	if (email.status === "SCHEDULED") {
		return c.json(
			{
				error: "Cannot update a scheduled email",
			},
			400,
		);
	}

	const updateData = result.data;
	return await prisma.email
		.update({
			where: {
				id: emailId,
			},
			data: {
				audience,
				subject,
				html,
			},
		})
		.then((email) => {
			return c.json(email, 200);
		})
		.catch((err) => {
			logger.error((err as Error).message);
			return c.json({ error: "Internal Server Error" }, 500);
		});
}
