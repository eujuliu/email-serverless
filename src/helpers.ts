import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import type { Prisma } from "../generated/prisma/index.js";
import { DeliveryError } from "./errors/index.js";

export function getUserIp(c: Context): string {
	const info = getConnInfo(c);
	const rawIP = info.remote.address;

	if (!rawIP) {
		return "unknown";
	}

	if (rawIP.startsWith("::ffff:")) {
		return rawIP.substring(7);
	}

	if (rawIP === "::1") {
		return "127.0.0.1";
	}

	return rawIP;
}

export function createPrismaErrorEntities(
	data: Record<string, string | number>,
	err: Error,
): Prisma.ErrorCreateManyInput[] {
	if (err instanceof DeliveryError) {
		return err.relation.map((error) => ({
			reason: error.join(": "),
			referenceId: data.id as string,
			type: "email",
			userId: data.userId as string,
		}));
	}

	return [
		{
			reason: err.message,
			type: "email",
			referenceId: data.id as string,
			userId: data.userId as string,
		},
	];
}
