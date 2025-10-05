import nodemailer from "nodemailer";
import type { Config } from "../config.js";
import { logger } from "./logger.js";

export function createTransporter(config: Config) {
	const transporter = nodemailer.createTransport({
		host: config.EMAIL_SMTP_HOST,
		port: config.EMAIL_SMTP_PORT,
		secure: !!config.NODE_ENV.match(/prod/g),
		auth: {
			user: config.EMAIL_USER,
			pass: config.EMAIL_PASSWORD,
		},
		pool: true,
		debug: !!config.NODE_ENV.match(/debug|dev/g),
		logger: logger,
	});

	transporter.on("error", (err) => {
		logger.error(err);
	});

	return transporter;
}
