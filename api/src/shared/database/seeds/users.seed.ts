import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hashPassword } from '../../../module/users/application/functions/hash_password';
import { USERS } from '../drizzle/schema/users';

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? 'demo@clavis.app';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'Demo1234';

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.DEMO_USER_PASSWORD
  ) {
    throw new Error('Defina DEMO_USER_PASSWORD para rodar o seed em produção.');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const [user] = await db
      .insert(USERS)
      .values({
        name: 'Conta Demo',
        email: DEMO_EMAIL,
        password_hash: await hashPassword(DEMO_PASSWORD),
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: USERS.email,
        // Mantém a senha existente; só garante a marcação de demo.
        set: { isDemo: true },
      })
      .returning({ id: USERS.id });

    console.log(`+ usuário demo ${DEMO_EMAIL} (${user.id}): isDemo = true`);
  } finally {
    await pool.end();
  }
}

void main();
