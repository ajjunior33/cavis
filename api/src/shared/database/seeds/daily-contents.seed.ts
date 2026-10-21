import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { CONTENT_MOODS } from '../drizzle/schema/content-moods';
import { DAILY_CONTENTS } from '../drizzle/schema/daily-contents';
import { MOODS } from '../drizzle/schema/moods';

type SeedContent = {
  title: string;
  reflection: string;
  practice: string;
  durationMin: number;
  moods: string[]; // slugs de moods (rode db:seed:moods antes)
};

const CONTENTS_SEED: SeedContent[] = [
  {
    title: 'Celebre o que está bom',
    reflection:
      'Momentos bons passam rápido quando não paramos para notá-los. Registrar o que deu certo ajuda o cérebro a reconhecer e repetir esses momentos.',
    practice:
      'Anote o que contribuiu para o seu bom humor hoje e como você pode repetir isso na semana.',
    durationMin: 3,
    moods: ['feliz', 'grato'],
  },
  {
    title: 'Saboreie o momento',
    reflection:
      'A calma é um recurso valioso. Estar em paz é a melhor hora para treinar a presença, porque o hábito fica mais forte para os dias difíceis.',
    practice:
      'Feche os olhos por 3 minutos e perceba a respiração e as sensações do corpo, sem mudar nada.',
    durationMin: 3,
    moods: ['calmo', 'neutro'],
  },
  {
    title: 'Direcione a sua energia',
    reflection:
      'A motivação é maior quando há clareza. Usar essa energia em algo que importa evita que ela se disperse em tarefas pequenas.',
    practice:
      'Escolha uma tarefa importante que você vem adiando e trabalhe nela por 25 minutos, sem interrupções.',
    durationMin: 25,
    moods: ['motivado'],
  },
  {
    title: 'Três coisas boas',
    reflection:
      'A gratidão muda o foco da atenção para o que está funcionando, sem negar o que é difícil.',
    practice:
      'Escreva três coisas pelas quais você é grato hoje e por que cada uma importa.',
    durationMin: 5,
    moods: ['grato', 'neutro', 'feliz'],
  },
  {
    title: 'Respiração para acalmar',
    reflection:
      'Quando a ansiedade aperta, a respiração costuma ficar curta e rápida. Alongar a expiração sinaliza ao corpo que ele pode relaxar.',
    practice:
      'Inspire pelo nariz contando até 4 e solte pela boca contando até 8. Repita por 3 minutos.',
    durationMin: 3,
    moods: ['ansioso', 'estressado'],
  },
  {
    title: 'Volte para o presente',
    reflection:
      'A ansiedade vive no futuro. Trazer os sentidos para o agora interrompe o ciclo de "e se" e devolve a sensação de controle.',
    practice:
      'Nomeie 5 coisas que você vê, 4 que toca, 3 que ouve, 2 que cheira e 1 que saboreia.',
    durationMin: 4,
    moods: ['ansioso'],
  },
  {
    title: 'Faça uma pausa de verdade',
    reflection:
      'O estresse acumulado pede intervalos reais, e não só uma troca de tela. Pequenas pausas reduzem a tensão antes que ela vire esgotamento.',
    practice:
      'Levante, alongue pescoço e ombros e beba um copo de água, longe do computador, por 5 minutos.',
    durationMin: 5,
    moods: ['estressado', 'cansado'],
  },
  {
    title: 'Descanso sem culpa',
    reflection:
      'O cansaço é um sinal do corpo, não uma falha. Respeitar o limite hoje preserva a energia de amanhã.',
    practice:
      'Escolha uma tarefa que pode esperar e dê a si mesmo 15 minutos de descanso, sem celular.',
    durationMin: 15,
    moods: ['cansado'],
  },
  {
    title: 'Acolha a tristeza',
    reflection:
      'Tristeza não precisa ser resolvida de imediato. Permitir que ela exista, com gentileza, costuma ajudá-la a passar mais rápido.',
    practice:
      'Escreva uma carta curta a si mesmo como escreveria a um amigo querido que está passando pelo mesmo.',
    durationMin: 7,
    moods: ['triste'],
  },
  {
    title: 'Um pequeno gesto de cuidado',
    reflection:
      'Em dias pesados, o cuidado não precisa ser grande. Uma ação simples já mostra ao corpo e à mente que você importa.',
    practice:
      'Faça uma coisa gentil por você agora: um banho, uma música de que gosta ou uma caminhada curta.',
    durationMin: 10,
    moods: ['triste', 'cansado'],
  },
  {
    title: 'Esfrie a cabeça',
    reflection:
      'A irritação traz uma descarga rápida de energia. Dar a ela um caminho seguro evita decisões e palavras de que podemos nos arrepender.',
    practice:
      'Afaste-se da situação, faça 10 respirações lentas e só então decida o que vai dizer ou fazer.',
    durationMin: 5,
    moods: ['irritado', 'estressado'],
  },
  {
    title: 'O que está por trás da irritação',
    reflection:
      'Muitas vezes a irritação esconde outra necessidade: cansaço, fome, sensação de injustiça ou de falta de limite.',
    practice:
      'Pergunte-se "do que eu preciso agora?" e escreva uma ação possível para atender essa necessidade.',
    durationMin: 5,
    moods: ['irritado'],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const allSlugs = [...new Set(CONTENTS_SEED.flatMap((c) => c.moods))];
    const moods = await db
      .select({ id: MOODS.id, slug: MOODS.slug })
      .from(MOODS)
      .where(inArray(MOODS.slug, allSlugs));
    const moodBySlug = new Map(moods.map((m) => [m.slug, m.id]));

    const missing = allSlugs.filter((slug) => !moodBySlug.has(slug));
    if (missing.length > 0) {
      throw new Error(
        `Moods não encontrados: ${missing.join(', ')}. Rode "npm run db:seed:moods" antes.`,
      );
    }

    for (const seed of CONTENTS_SEED) {
      const [existing] = await db
        .select({ id: DAILY_CONTENTS.id })
        .from(DAILY_CONTENTS)
        .where(eq(DAILY_CONTENTS.title, seed.title))
        .limit(1);

      if (existing) {
        console.log(`= ${seed.title}: já existe, ignorado`);
        continue;
      }

      const [content] = await db
        .insert(DAILY_CONTENTS)
        .values({
          title: seed.title,
          reflection: seed.reflection,
          practice: seed.practice,
          durationMin: seed.durationMin,
          isDemo: true,
        })
        .returning({ id: DAILY_CONTENTS.id });

      await db.insert(CONTENT_MOODS).values(
        seed.moods.map((slug) => ({
          contentId: content.id,
          moodId: moodBySlug.get(slug)!,
        })),
      );

      console.log(`+ ${seed.title}: criado (${seed.moods.join(', ')})`);
    }
  } finally {
    await pool.end();
  }
}

void main();
