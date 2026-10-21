import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { getTestDatabaseUrl } from './test-db';

// Recria o banco de testes e aplica TODAS as migrações do zero a cada execução.
export default async function globalSetup() {
  const testUrl = new URL(getTestDatabaseUrl());
  const dbName = testUrl.pathname.slice(1);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString: testUrl.toString() });
  try {
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await pool.query('CREATE SCHEMA public');
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: './src/shared/database/migrations',
    });
  } finally {
    await pool.end();
  }
}
