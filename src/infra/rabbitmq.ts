import * as amqp from "amqplib";
import type pino from "pino";
import type { Config } from "../config.js";

export async function initializeRabbitMQ(
  logger: pino.Logger<never, boolean>,
  config: Config,
) {
  const connection = await amqp.connect(config.RABBITMQ_CONNECTION_STRING);
  const channel = await connection.createChannel();

  connection.on("error", (err) =>
    logger.error(`[rabbitmq] ${(err as Error).message}`),
  );

  channel.on("error", (err) =>
    logger.error(`[rabbitmq channel] ${(err as Error).message}`),
  );

  logger.info("connected to rabbitmq with success!");

  return {
    connection,
    channel,
  };
}

export async function addDurableQueue(
  channel: amqp.Channel,
  name: string,
  exchange: string,
  routingKey: string,
) {
  try {
    const q = await channel.assertQueue(name.toLowerCase(), {
      durable: true,
      autoDelete: false,
    });
    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.bindQueue(q.queue, exchange, routingKey);
  } catch (err) {
    throw err as Error;
  }
}

export async function publish(
  channel: amqp.Channel,
  routingKey: string,
  exchangeName: string,
  data: Buffer,
) {
  const success = channel.publish(exchangeName, routingKey, data, {
    persistent: true,
    contentType: "application/json",
    timestamp: Date.now(),
  });

  if (!success) {
    throw new Error("Publish failed: no route or connection issue");
  }
}

export async function consume(
  channel: amqp.Channel,
  queue: string,
  handler: (data: Record<string, string | number>) => Promise<void>,
  onError: (
    data: Record<string, string | number>,
    err: Error,
  ) => Promise<boolean>,
) {
  return await channel.consume(queue, async (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      try {
        await handler(data);
        channel.ack(msg);
      } catch (err) {
        const ack = await onError(data, err as Error);
        channel.nack(msg, false, ack);
      }
    }
  });
}
