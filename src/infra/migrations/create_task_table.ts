import type { PoolClient } from "pg";

export async function createTaskTable(pool: PoolClient) {
	await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

	await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      type            VARCHAR(50) NOT NULL,
      cost            INTEGER NOT NULL,
      run_at          TIMESTAMPTZ NOT NULL,
      timezone        TEXT NOT NULL,
      retries         INTEGER NOT NULL,
      priority        INTEGER NOT NULL,
      reference_id    VARCHAR(128) NOT NULL,
      idempotency_key VARCHAR(128) NOT NULL,
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
      status          task_status NOT NULL DEFAULT 'PENDING'
    );
  `);

	await pool.query(
		`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`,
	);
}
