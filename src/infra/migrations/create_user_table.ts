import type { PoolClient } from "pg";

export async function createUserTable(pool: PoolClient) {
	await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      username       VARCHAR(20) UNIQUE NOT NULL,
      email          VARCHAR(255) UNIQUE NOT NULL,
      password       VARCHAR(72) NOT NULL,
      credits        INTEGER NOT NULL,
      frozen_credits INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT users_email_username_idx UNIQUE (email, username)
    );
  `);
}
