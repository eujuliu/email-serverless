import type pino from "pino";
import z from "zod";

const Schema = z.object({
	PORT: z.preprocess(
		(val) => Number(val),
		z.number().min(1, "PORT is required"),
	),
	NODE_ENV: z.string().default("production"),
});

export function initializeConfig(
	logger: pino.Logger<never, boolean>,
): z.infer<typeof Schema> {
	try {
		const parsed = Schema.safeParse(process.env);

		if (parsed.error) {
			throw new Error(parsed.error.message);
		}

		return parsed.data;
	} catch (err) {
		logger.error((err as Error).message);
		throw new Error(
			"Invalid or missing environment variables. Check logs for details.",
		);
	}
}
