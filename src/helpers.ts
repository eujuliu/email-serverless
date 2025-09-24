import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

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
