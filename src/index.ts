import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { pino } from "pino";
import { initializeConfig } from "./config.js";

function main() {
	const app = new Hono();
	const logger = pino();
	const { PORT, NODE_ENV } = initializeConfig(logger);

	app.use(
		pinoLogger({
			pino: { level: NODE_ENV.match(/prod/) ? "info" : "debug" },
		}),
	);

	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	serve(
		{
			fetch: app.fetch,
			port: PORT,
		},
		(info) => {
			logger.info(`server is running on http://localhost:${info.port}`);
		},
	);
}

main();
