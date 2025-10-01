import jwt from "jsonwebtoken";
import { logger } from "./logger.js";

export type JwtClaims = {
  userId: string;
  email: string;
};

export function authorization(token: string, secret: string) {
  try {
    const decoded = jwt.verify(token.replace("Bearer ", "").trim(), secret);

    return decoded as JwtClaims;
  } catch (err) {
    logger.error(err);

    return null;
  }
}
