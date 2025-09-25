import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type JwtVariables, jwt } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";
import { pinoLogger } from "hono-pino";
import { type Logger, pino } from "pino";
import type { RedisClientType } from "redis";
import { PrismaClient } from "../generated/prisma/index.js";
import { initializeConfig } from "./config.js";
import { createEmailHandler } from "./handlers/create_email.js";
import { getEmailHandler } from "./handlers/get_email.js";
import { getEmailsHandler } from "./handlers/get_emails.js";
import { sendEmailsHandler } from "./handlers/send_emails.js";
import { updateEmailHandler } from "./handlers/update_email.js";
import { addDurableQueue, initializeRabbitMQ } from "./infra/rabbitmq.js";
import { rateLimiter } from "./infra/rate_limiter.js";
import { initializeRedis } from "./infra/redis.js";

export type JwtClaims = {
	userId: string;
	email: string;
};

export type Env = {
	Variables: JwtVariables & {
		prisma: PrismaClient;
		logger: Logger;
	};
};

export const app = new Hono<Env>();

async function main() {
	const logger = pino();
	const config = initializeConfig(logger);
	const { PORT, NODE_ENV, JWT_SECRET } = config;

	logger.level = NODE_ENV.match(/prod/) ? "info" : "debug";

	const prisma = new PrismaClient({
		errorFormat: "minimal",
	});
	const redis = await initializeRedis(logger, config);
	const rabbitmq = await initializeRabbitMQ(logger, config);

	await addDurableQueue(
		rabbitmq.channel,
		"tasks-result",
		"tasks",
		"task.result",
	);

	await addDurableQueue(
		rabbitmq.channel,
		"email-task",
		"tasks",
		"task.email.send",
	);

	const jwtMiddleware = jwt({
		secret: JWT_SECRET,
	});
	const rateLimiterMiddleware = rateLimiter(
		config,
		redis as unknown as RedisClientType,
	);

	app.use(
		pinoLogger({
			pino: pino,
		}),
	);
	app.use(cors());
	app.use(secureHeaders());
	app.use((c, next) => {
		c.set("prisma", prisma);
		c.set("logger", logger);
		return next();
	});

	app.get("/ping", (c) => {
		return c.text("pong");
	});

	app.post("/email", rateLimiterMiddleware, jwtMiddleware, createEmailHandler);
	app.put(
		"/email/:id",
		rateLimiterMiddleware,
		jwtMiddleware,
		updateEmailHandler,
	);
	app.get("/email/:id", rateLimiterMiddleware, jwtMiddleware, getEmailHandler);
	app.get("/emails", rateLimiterMiddleware, jwtMiddleware, getEmailsHandler);

	await sendEmailsHandler(logger, config, prisma, rabbitmq.channel);

	process.once("SIGTERM", async () => {
		logger.info("SIGTERM received, closing server!");
		await redis.close();
		await prisma.$disconnect();
		await rabbitmq.channel.close();
		await rabbitmq.connection.close();
		process.exit(0);
	});

	serve(
		{
			fetch: app.fetch,
			port: PORT,
		},
		async (info) => {
			logger.info(`running on http://${info.address}:${info.port}`);
		},
	);
}

main().catch(console.error);
