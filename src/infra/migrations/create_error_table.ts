import type { PoolClient } from "pg";

export async function createErrorTable(pool: PoolClient) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS errors (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      type         VARCHAR(50) NOT NULL,
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      reason       VARCHAR(320) NOT NULL,
      reference_id VARCHAR(128) NOT NULL
    );
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors(user_id);`,
  );
}
