import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { MOODS, NewMood } from '../drizzle/schema/moods';

const MOODS_SEED: NewMood[] = [
  { slug: 'feliz', label: 'Feliz', emoji: '😊', soft_order: 1 },
  { slug: 'calmo', label: 'Calmo', emoji: '😌', soft_order: 2 },
  { slug: 'grato', label: 'Grato', emoji: '🙏', soft_order: 3 },
  { slug: 'motivado', label: 'Motivado', emoji: '💪', soft_order: 4 },
  { slug: 'neutro', label: 'Neutro', emoji: '😐', soft_order: 5 },
  { slug: 'cansado', label: 'Cansado', emoji: '😴', soft_order: 6 },
  { slug: 'ansioso', label: 'Ansioso', emoji: '😰', soft_order: 7 },
  { slug: 'estressado', label: 'Estressado', emoji: '😫', soft_order: 8 },
  { slug: 'triste', label: 'Triste', emoji: '😢', soft_order: 9 },
  { slug: 'irritado', label: 'Irritado', emoji: '😠', soft_order: 10 },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    for (const mood of MOODS_SEED) {
      const [created] = await db
        .insert(MOODS)
        .values(mood)
        .onConflictDoNothing({ target: MOODS.slug })
        .returning({ id: MOODS.id });

      console.log(
        created
          ? `+ ${mood.slug}: criado`
          : `= ${mood.slug}: já existe, ignorado`,
      );
    }
  } finally {
    await pool.end();
  }
}

void main();
