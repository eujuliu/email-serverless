import { pino } from "pino";

export const logger = pino({
	level: process.env?.NODE_ENV?.match(/prod/) ? "info" : "debug",
});
