import type { Context } from "hono";
import z from "zod";
import type { Env, JwtClaims } from "../index.js";

export const GetEmailRequest = z.object({
	id: z.uuidv4().nonoptional(),
	userId: z.uuidv4().nonoptional(),
});

export async function getEmailHandler(c: Context<Env>) {
	const claims = c.get("jwtPayload") as JwtClaims;
	const emailId = c.req.param("id");

	const result = GetEmailRequest.safeParse({
		id: emailId,
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

	const prisma = c.get("prisma");
	const { id, userId } = result.data;

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
			userId: userId,
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

	return c.json(email, 200);
}
