import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { createDatabase } from "../infra/db.js";
import { createConfig } from "../config.js";
import { lambdaHandler } from "../helpers.js";
import { getEmailHandler } from "../handlers/get_email.js";
import { getEmailsHandler } from "../handlers/get_emails.js";
import { createEmailHandler } from "../handlers/create_email.js";
import { updateEmailHandler } from "../handlers/update_email.js";
import { deleteEmailHandler } from "../handlers/delete_email.js";
import { NotFoundError, UnauthorizedError } from "../errors/index.js";
import { authorization } from "../infra/authorization.js";

const config = createConfig(process.env);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const jwtClaims = authorization(
    event.headers.authorization ?? "",
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

  switch (`${event.httpMethod}${event.resource}`) {
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
