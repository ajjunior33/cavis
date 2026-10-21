import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { PLAN_DAYS } from '../drizzle/schema/plan-days';
import { PLANS } from '../drizzle/schema/plans';

type SeedDay = { title: string; content: string; practice?: string };

type SeedPlan = {
  slug: string;
  title: string;
  description: string;
  days: SeedDay[];
};

const PLANS_SEED: SeedPlan[] = [
  {
    slug: 'respirar-e-acalmar',
    title: 'Respirar e Acalmar',
    description:
      'Cinco dias de práticas curtas de respiração para baixar o ritmo quando a ansiedade aperta.',
    days: [
      {
        title: 'Perceba a sua respiração',
        content:
          'Antes de mudar qualquer coisa, observe como você respira hoje. Sem julgar: só note se o ar fica no peito ou desce até a barriga.',
        practice:
          'Sentado, feche os olhos por 2 minutos e apenas acompanhe cada inspiração e expiração.',
      },
      {
        title: 'Respiração diafragmática',
        content:
          'Respirar pela barriga ativa o sistema nervoso parassimpático, responsável por sinalizar ao corpo que está tudo bem.',
        practice:
          'Com uma mão na barriga, inspire pelo nariz por 4 segundos e solte pela boca por 6. Repita por 3 minutos.',
      },
      {
        title: 'Expiração longa',
        content:
          'Quanto mais longa a expiração em relação à inspiração, mais o corpo entende que pode relaxar.',
        practice:
          'Inspire contando até 4 e expire contando até 8. Faça 10 ciclos.',
      },
      {
        title: 'Respiração em caixa',
        content:
          'Uma técnica usada para recuperar o foco em momentos de pressão, com quatro tempos iguais.',
        practice:
          'Inspire 4s, segure 4s, expire 4s, segure 4s. Repita por 4 minutos.',
      },
      {
        title: 'Leve para o seu dia',
        content:
          'A prática vira hábito quando está ligada a um gatilho do cotidiano. Escolha um momento fixo para respirar conscientemente.',
        practice:
          'Escolha um gatilho (ex.: antes de abrir o e-mail) e faça 5 respirações lentas toda vez que ele ocorrer hoje.',
      },
    ],
  },
  {
    slug: 'gratidao-em-7-dias',
    title: 'Gratidão em 7 Dias',
    description:
      'Uma semana para treinar o olhar para o que está funcionando, mesmo em dias difíceis.',
    days: [
      {
        title: 'Três coisas simples',
        content:
          'Gratidão não exige grandes acontecimentos. Comece pelo básico: o que, hoje, tornou o seu dia um pouco mais fácil?',
        practice: 'Anote três coisas pequenas pelas quais você é grato hoje.',
      },
      {
        title: 'Pessoas que ajudam',
        content:
          'Somos sustentados por pessoas que muitas vezes passam despercebidas. Reconhecê-las fortalece vínculos.',
        practice:
          'Pense em alguém que te ajudou recentemente e escreva por quê.',
      },
      {
        title: 'Agradeça em voz alta',
        content:
          'Expressar gratidão amplifica o efeito, tanto em quem agradece quanto em quem recebe.',
        practice:
          'Envie uma mensagem de agradecimento sincera para a pessoa de ontem.',
      },
      {
        title: 'Gratidão pelo corpo',
        content:
          'O corpo trabalha o dia inteiro sem pedir nada. Notar isso muda a forma como nos tratamos.',
        practice:
          'Faça um escaneamento corporal de 3 minutos, agradecendo mentalmente a cada parte.',
      },
      {
        title: 'O difícil também ensina',
        content:
          'Gratidão não é negar o que dói. É perceber o que uma situação difícil te ensinou ou te mostrou.',
        practice:
          'Escolha um desafio recente e escreva uma coisa que ele te ensinou.',
      },
      {
        title: 'Pequenos prazeres',
        content:
          'Saborear o momento presente é uma forma ativa de gratidão: o café, o sol, uma música.',
        practice:
          'Faça uma refeição ou bebida de hoje sem telas, prestando atenção em cada gole ou garfada.',
      },
      {
        title: 'Carta de gratidão',
        content:
          'Para fechar a semana, junte tudo em um registro que você possa reler nos dias ruins.',
        practice:
          'Escreva uma carta curta para si mesmo listando o que a semana te mostrou de bom.',
      },
    ],
  },
  {
    slug: 'sono-tranquilo',
    title: 'Sono Tranquilo',
    description:
      'Três noites para preparar mente e corpo para um descanso mais profundo.',
    days: [
      {
        title: 'Desacelere a noite',
        content:
          'O sono começa horas antes de deitar. Reduzir estímulos no fim do dia avisa ao cérebro que é hora de desligar.',
        practice:
          'Guarde o celular 30 minutos antes de dormir e troque por algo calmo (leitura, alongamento leve).',
      },
      {
        title: 'Descarregue a mente',
        content:
          'Pensamentos acumulados mantêm o cérebro em alerta. Colocá-los no papel libera espaço mental.',
        practice:
          'Anote tudo que está na sua cabeça e uma próxima ação para cada item pendente de amanhã.',
      },
      {
        title: 'Relaxamento progressivo',
        content:
          'Tensionar e soltar os músculos em sequência ajuda o corpo a perceber a diferença entre tensão e relaxamento.',
        practice:
          'Deitado, contraia cada grupo muscular por 5 segundos e solte, dos pés até o rosto.',
      },
    ],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    for (const seed of PLANS_SEED) {
      const [plan] = await db
        .insert(PLANS)
        .values({
          slug: seed.slug,
          title: seed.title,
          description: seed.description,
          totalDays: seed.days.length,
          isDemo: true,
        })
        .onConflictDoNothing({ target: PLANS.slug })
        .returning();

      if (!plan) {
        console.log(`= ${seed.slug}: já existe, ignorado`);
        continue;
      }

      await db.insert(PLAN_DAYS).values(
        seed.days.map((day, index) => ({
          planId: plan.id,
          dayNumber: index + 1,
          title: day.title,
          content: day.content,
          practice: day.practice,
        })),
      );

      console.log(`+ ${seed.slug}: criado com ${seed.days.length} dias`);
    }
  } finally {
    await pool.end();
  }
}

void main();
