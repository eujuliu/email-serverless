import type { Context } from "hono";
import z from "zod";
import type { Env, JwtClaims } from "../index.js";

export const CreateEmailRequest = z.object({
  audience: z.array(z.string()).min(1),
  subject: z.string().min(4),
  html: z.string().min(1),
  userId: z.uuidv4().nonoptional(),
});

export async function createEmailHandler(c: Context<Env>) {
  const { logger } = c.var;
  const prisma = c.get("prisma");
  const claims = c.get("jwtPayload") as JwtClaims;
  const body = await c.req.json();
  const result = CreateEmailRequest.safeParse({ ...claims, ...body });

  if (!result.success) {
    return c.json(
      {
        error: result.error.message,
      },
      400,
    );
  }

  const { userId, subject, audience, html } = result.data;

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

  return await prisma.email
    .create({
      data: {
        subject,
        audience,
        html,
        userId,
      },
    })
    .then((email) => {
      return c.json(email, 201);
    })
    .catch((err) => {
      logger.error((err as Error).message);
      return c.json({ error: "Internal Server Error" }, 500);
    });
}
