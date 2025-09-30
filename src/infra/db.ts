import { Pool, type PoolClient } from "pg";
import type { Config } from "../config.js";
import { logger } from "./logger.js";

export async function createDatabase(config: Config) {
  const pool = new Pool({
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
  });

  pool.on("error", (err) => {
    logger.error(`unexpected error on idle client ${err.message}`);
    process.exit(-1);
  });

  pool.on("connect", () => {
    logger.info("connected to db with success!");
  });

  const client = await pool.connect();

  return client;
}

type Where = Record<string, unknown>;
type Data = Record<string, unknown>;
type Table = "users" | "tasks" | "emails" | "errors";

function buildWhere(
  where?: Where,
  startIndex = 1,
): { clause: string; values: unknown[] } {
  if (!where || Object.keys(where).length === 0) {
    return { clause: "", values: [] };
  }

  const parts: string[] = [];
  const values: unknown[] = [];
  let i = startIndex;

  for (const [key, value] of Object.entries(where)) {
    parts.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }

  return { clause: `WHERE ${parts.join(" AND ")}`, values };
}

export async function findFirst(pool: PoolClient, table: Table, where?: Where) {
  const { clause, values } = buildWhere(where);
  const res = await pool.query(
    `SELECT * FROM ${table} ${clause} LIMIT 1`,
    values,
  );
  return res.rows[0] ?? null;
}

export async function findMany(
  pool: PoolClient,
  table: Table,
  where?: Where,
  offset = 0,
  limit = 10,
  orderBy: "ASC" | "DESC" = "ASC",
) {
  const { clause, values } = buildWhere(where);
  const n = values.length;

  const res = await pool.query(
    `SELECT * FROM ${table} ${clause} ORDER BY updated_at ${orderBy} OFFSET $${n + 1} LIMIT $${n + 2};`,
    [...values, offset, limit],
  );

  return res.rows;
}

export async function create(pool: PoolClient, table: Table, data: Data) {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

  const res = await pool.query(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values,
  );

  return res.rows[0];
}

export async function createMany(pool: PoolClient, table: Table, data: Data[]) {
  if (data.length === 0) return [];

  const keys = Object.keys(data[0]);
  const values: unknown[] = [];

  const valuePlaceholders = data
    .map(
      (_row, rowIndex) =>
        `(${keys.map((_, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`).join(", ")})`,
    )
    .join(", ");

  for (const row of data) {
    values.push(...Object.values(row));
  }

  const res = await pool.query(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${valuePlaceholders} RETURNING *`,
    values,
  );

  return res.rows;
}

export async function update(
  pool: PoolClient,
  table: Table,
  where: Where,
  data: Data,
) {
  const setKeys = Object.keys(data)
    .map((k, i) => `${k} = $${i + 1}`)
    .join(", ");

  const { clause, values: whereValues } = buildWhere(
    where,
    Object.keys(data).length + 1,
  );

  const res = await pool.query(
    `UPDATE ${table} SET ${setKeys} ${clause} RETURNING *`,
    [...Object.values(data), ...whereValues],
  );
  return res.rows[0] ?? null;
}

export async function remove(pool: PoolClient, table: Table, where: Where) {
  const { clause, values } = buildWhere(where);
  const res = await pool.query(
    `DELETE FROM ${table} ${clause} RETURNING *`,
    values,
  );
  return res.rows[0] ?? null;
}

export async function count(pool: PoolClient, table: Table, where?: Where) {
  const { clause, values } = buildWhere(where);
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM ${table} ${clause}`,
    values,
  );
  return res.rows[0]?.count ?? 0;
}
