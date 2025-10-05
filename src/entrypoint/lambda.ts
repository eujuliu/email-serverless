import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import type z from "zod";
import { createConfig } from "../config.js";
import { NotFoundError, UnauthorizedError } from "../errors/index.js";
import { createEmailHandler } from "../handlers/create_email.js";
import { deleteEmailHandler } from "../handlers/delete_email.js";
import { getEmailHandler } from "../handlers/get_email.js";
import { getEmailsHandler } from "../handlers/get_emails.js";
import {
	type SendEmailsRequest,
	sendEmailsHandler,
} from "../handlers/send_emails.js";
import { updateEmailHandler } from "../handlers/update_email.js";
import { lambdaHandler } from "../helpers.js";
import { authorization } from "../infra/authorization.js";
import { createDatabase } from "../infra/db.js";
import { createTransporter } from "../infra/email.js";
import { createRabbitMQ, publish } from "../infra/rabbitmq.js";

const config = createConfig(process.env);

export const handler = async (
	event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
	const jwtClaims = authorization(
		event.headers?.authorization ?? "",
		config.JWT_SECRET,
	);

	if (!jwtClaims) {
		const error = new UnauthorizedError({
			message: "Invalid authorization header token",
		});

		return {
			statusCode: error.code,
			body: JSON.stringify(error),
			isBase64Encoded: false,
		};
	}

	const db = await createDatabase(config);
	const request = { ...event, jwtClaims };

	if (event.resource === "sendEmail") {
		const rabbitmq = await createRabbitMQ(config);
		const body = JSON.parse(request.body ?? "{}");
		const email = createTransporter(config);
		const result = await sendEmailsHandler(
			body as z.infer<typeof SendEmailsRequest>,
			db,
			email,
		);

		await publish(
			rabbitmq.channel,
			"task.result",
			"tasks",
			Buffer.from(JSON.stringify(result)),
			result.id,
		);

		return {
			statusCode: result.status === "FAILED" ? 400 : 200,
			body: JSON.stringify(result),
			isBase64Encoded: false,
		};
	}

	const key = `${event.httpMethod}${event.resource}`;

	switch (key) {
		case `GET/email/{id}`:
			return await lambdaHandler(request, getEmailHandler, db);
		case `GET/emails`:
			return await lambdaHandler(request, getEmailsHandler, db);
		case `POST/email`:
			return await lambdaHandler(request, createEmailHandler, db);
		case `PUT/email/{id}`:
			return await lambdaHandler(request, updateEmailHandler, db);
		case `DELETE/email/{id}`:
			return await lambdaHandler(request, deleteEmailHandler, db);
		default:
	}

	const error = new NotFoundError({});

	return {
		statusCode: error.code,
		body: JSON.stringify(error),
		isBase64Encoded: false,
	};
};
