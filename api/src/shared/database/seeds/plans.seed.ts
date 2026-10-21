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
  {
    slug: 'mindfulness-para-iniciantes',
    title: 'Mindfulness para Iniciantes',
    description:
      'Cinco dias para aprender a estar presente, um passo simples de cada vez.',
    days: [
      {
        title: 'O que é atenção plena',
        content:
          'Mindfulness é prestar atenção ao que está acontecendo agora, de propósito e sem julgamento. Não é esvaziar a mente.',
        practice:
          'Por 3 minutos, sente-se e perceba os sons ao redor sem tentar classificá-los.',
      },
      {
        title: 'Âncora no corpo',
        content:
          'Quando a mente vagueia, o corpo é um ponto de retorno confiável. Os pés no chão são uma âncora fácil.',
        practice:
          'Em pé, sinta o contato dos pés com o chão por 2 minutos. Ao se distrair, volte para os pés.',
      },
      {
        title: 'Pensamentos são passageiros',
        content:
          'Você não precisa acreditar em todo pensamento nem lutar contra ele. Observe-o como uma nuvem que passa.',
        practice:
          'Sentado, nomeie mentalmente cada pensamento como "pensando" e deixe-o ir. Faça por 4 minutos.',
      },
      {
        title: 'Atenção no cotidiano',
        content:
          'Tarefas automáticas, como lavar a louça, viram prática quando feitas com atenção total.',
        practice:
          'Escolha uma tarefa rotineira de hoje e faça-a devagar, notando temperatura, textura e cheiro.',
      },
      {
        title: 'Escaneamento corporal',
        content:
          'Percorrer o corpo com a atenção revela tensões que passam despercebidas durante o dia.',
        practice:
          'Deitado, leve a atenção da cabeça aos pés, sem tentar mudar nada. Dedique 7 minutos.',
      },
    ],
  },
  {
    slug: 'foco-e-produtividade',
    title: 'Foco e Produtividade',
    description:
      'Cinco dias de hábitos simples para proteger a atenção e render mais com menos desgaste.',
    days: [
      {
        title: 'Defina uma prioridade',
        content:
          'Foco começa com escolha. Ter uma prioridade clara reduz a sensação de estar sempre atrasado.',
        practice:
          'Escreva a única tarefa que, se concluída hoje, fará o dia valer a pena. Faça-a primeiro.',
      },
      {
        title: 'Blocos de foco',
        content:
          'O cérebro rende melhor em ciclos curtos de concentração seguidos de pausas reais.',
        practice:
          'Trabalhe 25 minutos sem interrupções, depois descanse 5. Repita duas vezes.',
      },
      {
        title: 'Reduza as distrações',
        content:
          'Cada notificação custa minutos para recuperar o foco. O ambiente decide mais do que a força de vontade.',
        practice:
          'Silencie notificações e deixe o celular fora do alcance durante um bloco de trabalho.',
      },
      {
        title: 'Uma coisa de cada vez',
        content:
          'Alternar entre tarefas parece produtivo, mas aumenta o cansaço e os erros.',
        practice:
          'Escolha uma tarefa e fique só nela por 20 minutos. Anote o que surgir para tratar depois.',
      },
      {
        title: 'Encerre o dia',
        content:
          'Um ritual de fim de expediente separa trabalho e descanso e deixa o amanhã mais leve.',
        practice:
          'Liste as 3 prioridades de amanhã e feche todas as abas e janelas abertas.',
      },
    ],
  },
  {
    slug: 'autocompaixao',
    title: 'Autocompaixão',
    description:
      'Sete dias para aprender a tratar a si mesmo com a mesma gentileza que oferece a quem ama.',
    days: [
      {
        title: 'Perceba a voz interna',
        content:
          'Muitas vezes falamos conosco de um jeito que jamais falaríamos com um amigo. O primeiro passo é notar.',
        practice:
          'Durante o dia, anote duas frases duras que você disse a si mesmo.',
      },
      {
        title: 'Fale como a um amigo',
        content:
          'Tratar-se com gentileza não é fraqueza: é o que sustenta a recuperação depois de um erro.',
        practice:
          'Reescreva uma das frases de ontem como se estivesse falando com um amigo querido.',
      },
      {
        title: 'Humanidade comum',
        content:
          'Falhar, sofrer e se sentir inadequado são experiências compartilhadas. Você não está sozinho nisso.',
        practice:
          'Diante de uma dificuldade de hoje, repita: "outras pessoas também passam por isso".',
      },
      {
        title: 'Gesto de acolhimento',
        content:
          'O toque físico gentil sinaliza segurança ao corpo e acalma a resposta de estresse.',
        practice:
          'Coloque uma mão no peito por 1 minuto e respire devagar, oferecendo-se uma frase de apoio.',
      },
      {
        title: 'Perdoe um erro',
        content:
          'Carregar culpa antiga consome energia. Perdoar não apaga o que houve, mas libera o presente.',
        practice:
          'Escolha um erro do passado e escreva o que aprendeu com ele e uma frase de perdão.',
      },
      {
        title: 'Cuidado concreto',
        content:
          'Autocompaixão também é ação: descansar, comer bem e pedir ajuda quando precisa.',
        practice: 'Faça hoje uma coisa pequena e concreta que cuide de você.',
      },
      {
        title: 'Seu lembrete pessoal',
        content:
          'Guardar uma frase gentil à mão ajuda nos momentos em que a crítica interna volta.',
        practice:
          'Escreva uma frase de acolhimento e coloque-a em um lugar que você veja todo dia.',
      },
    ],
  },
  {
    slug: 'manha-com-intencao',
    title: 'Manhã com Intenção',
    description:
      'Quatro dias para começar o dia com calma e direção, em vez de no piloto automático.',
    days: [
      {
        title: 'Não comece pelo celular',
        content:
          'Os primeiros minutos do dia moldam o tom emocional. Entrar direto em notícias e mensagens acelera a mente.',
        practice:
          'Espere 10 minutos antes de abrir o celular ao acordar. Beba água e alongue-se.',
      },
      {
        title: 'Defina uma intenção',
        content:
          'Uma intenção não é uma meta: é a forma como você quer se apresentar ao dia, como calma ou presença.',
        practice:
          'Complete a frase "Hoje eu quero ser..." e releia-a antes de sair de casa.',
      },
      {
        title: 'Movimento leve',
        content:
          'Poucos minutos de movimento despertam o corpo e melhoram a disposição.',
        practice:
          'Faça 5 minutos de alongamento ou uma caminhada curta logo ao acordar.',
      },
      {
        title: 'Um momento só seu',
        content:
          'Reservar alguns minutos antes das demandas dos outros fortalece a sensação de controle.',
        practice:
          'Tome o café ou chá sem telas por 10 minutos, prestando atenção ao sabor.',
      },
    ],
  },
  {
    slug: 'lidando-com-a-ansiedade',
    title: 'Lidando com a Ansiedade',
    description:
      'Seis dias de estratégias práticas para reconhecer a ansiedade e diminuir sua intensidade.',
    days: [
      {
        title: 'Nomeie o que sente',
        content:
          'Dar nome à emoção reduz sua intensidade. "Estou ansioso" já cria um pequeno espaço entre você e o sentimento.',
        practice:
          'Quando a ansiedade aparecer, diga em voz alta ou escreva: "estou sentindo ansiedade".',
      },
      {
        title: 'Técnica 5-4-3-2-1',
        content:
          'Trazer os sentidos para o presente interrompe o ciclo de pensamentos sobre o futuro.',
        practice:
          'Identifique 5 coisas que vê, 4 que toca, 3 que ouve, 2 que cheira e 1 que saboreia.',
      },
      {
        title: 'Separe fato de hipótese',
        content:
          'A ansiedade trata possibilidades como certezas. Distinguir o que é fato ajuda a recuperar a perspectiva.',
        practice:
          'Anote uma preocupação e divida em duas colunas: "o que eu sei" e "o que estou supondo".',
      },
      {
        title: 'Mova o corpo',
        content:
          'A ansiedade mobiliza energia. Movimento é um jeito saudável de descarregá-la.',
        practice: 'Caminhe rápido por 10 minutos ou faça 20 agachamentos.',
      },
      {
        title: 'Hora de preocupar-se',
        content:
          'Reservar um horário para as preocupações evita que elas invadam o dia inteiro.',
        practice:
          'Defina 15 minutos para se preocupar. Fora dele, anote o que surgir e adie para esse horário.',
      },
      {
        title: 'Seu plano de calma',
        content:
          'Ter um plano pronto antes da crise torna mais fácil agir quando ela chega.',
        practice:
          'Escreva 3 ações que ajudam você a se acalmar e deixe a lista no celular.',
      },
    ],
  },
  {
    slug: 'desligar-do-trabalho',
    title: 'Desligar do Trabalho',
    description:
      'Três dias para criar uma fronteira saudável entre o expediente e o seu descanso.',
    days: [
      {
        title: 'Ritual de transição',
        content:
          'O cérebro precisa de um sinal claro de que o trabalho terminou, principalmente em home office.',
        practice:
          'Crie um ritual de encerramento: feche o notebook, troque de roupa ou dê uma volta de 5 minutos.',
      },
      {
        title: 'Limite as mensagens',
        content:
          'Estar sempre disponível mantém o corpo em alerta e impede a recuperação.',
        practice:
          'Defina um horário após o qual você não responde mensagens de trabalho e silencie os grupos.',
      },
      {
        title: 'Recupere o prazer',
        content:
          'Descansar de verdade é fazer algo que devolve energia, não apenas trocar uma tela por outra.',
        practice:
          'Dedique 30 minutos a algo que você gosta e que não envolve telas.',
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
