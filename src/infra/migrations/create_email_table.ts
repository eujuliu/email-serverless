import type { PoolClient } from "pg";

export async function createEmailTable(pool: PoolClient) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      audience   TEXT[] NOT NULL,
      subject    TEXT NOT NULL,
      html       TEXT NOT NULL,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);`,
  );
}
