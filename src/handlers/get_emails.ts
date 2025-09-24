import type { Context } from "hono";
import z from "zod";
import type { Env, JwtClaims } from "../index.js";

export const GetEmailsRequest = z.object({
	userId: z.uuidv4().nonoptional(),
	offset: z.preprocess((val) => Number(val), z.number()).default(0),
	limit: z
		.preprocess((val) => Number(val), z.number().min(10).max(100))
		.default(10),
	orderBy: z.enum(["asc", "desc"]).default("asc"),
});

export async function getEmailsHandler(c: Context<Env>) {
	const claims = c.get("jwtPayload") as JwtClaims;
	const result = GetEmailsRequest.safeParse({
		...claims,
		offset: c.req.param("offset"),
		limit: c.req.param("limit"),
		orderBy: c.req.param("orderBy"),
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
	const { userId, offset, limit, orderBy } = result.data;

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

	const emails = await prisma.email.findMany({
		where: {
			userId,
		},
		skip: offset,
		take: limit,
		orderBy: {
			updatedAt: orderBy,
		},
	});
	const count = await prisma.email.count({ where: { userId } });

	return c.json(
		{
			emails,
			pagination: {
				offset,
				limit,
				orderBy,
				total: count,
			},
		},
		200,
	);
}
