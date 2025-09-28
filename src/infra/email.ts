import nodemailer from "nodemailer";
import type { Config } from "../config.js";

export function createTransporter(config: Config) {
	const transporter = nodemailer.createTransport({
		host: config.EMAIL_SMTP_HOST,
		secure: !!config.NODE_ENV.match(/prod/),
		auth: {
			user: config.EMAIL_USER,
			pass: config.EMAIL_PASSWORD,
		},
		pool: true,
	});

	return transporter;
}
