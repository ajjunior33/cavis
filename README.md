# Clavis

App de **bem-estar emocional**. A pessoa registra como se sente (check-in de humor), recebe um conteúdo de reflexão + prática adequado ao estado do dia e acompanha planos temáticos de vários dias (respiração, gratidão, sono…), com o progresso salvo.

O projeto é um monorepo com duas aplicações:

| Pasta | O que é | Stack principal |
| --- | --- | --- |
| [`api/`](api) | API REST | NestJS 12, Drizzle ORM, PostgreSQL |
| [`vite-ui/`](vite-ui) | Front-end PWA (mobile first) | React 19, Vite 8, TanStack Router, Tailwind 4 |

> Detalhes de arquitetura, banco, endpoints e segurança da API estão em [`api/README.md`](api/README.md).

## Funcionalidades

- **Cadastro e login** com JWT (access + refresh token).
- **Check-in de humor** com nota opcional.
- **Conteúdo do dia**: reflexão + prática escolhida pelo humor do último check-in, igual o dia inteiro.
- **Planos temáticos** de N dias: inscrição, marcação de cada dia e conclusão automática.
- **Jornada**: últimos check-ins e % de progresso em cada plano.
- **Perfil**: editar dados e trocar senha.
- **PWA**: instalável no celular, com service worker (a API nunca fica em cache).

## Pré-requisitos

- Node.js **24+** e npm
- PostgreSQL 14+ (local ou Docker)

## Como executar

### 1. Banco de dados

O `docker-compose.yml` da raiz está vazio. Suba um container avulso:

```bash
docker run -d --name clavis-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=clavis \
  -p 5432:5432 \
  postgres:16
```

### 2. API

```bash
cd api
npm install
```

Crie `api/.env`:

```dotenv
PORT=3333
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clavis

JWT_ACCESS_SECRET=troque-por-um-segredo-longo-e-aleatorio
JWT_REFRESH_SECRET=troque-por-outro-segredo-longo-e-aleatorio
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Exigida pela validação do env, mas ainda não usada pelo código
REDIS_URL=redis://localhost:6379

# Opcional: origem liberada no CORS (padrão http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

Aplique as migrations, popule os dados e inicie:

```bash
npm run db:migrate       # cria as tabelas
npm run db:seed          # tudo de uma vez (moods, planos, conteúdos, usuário demo)
# ou individualmente, nesta ordem:
npm run db:seed:moods    # estados emocionais
npm run db:seed:plans    # planos temáticos
npm run db:seed:contents # conteúdos do dia (precisa dos moods)
npm run db:seed:users    # usuário(s) de demonstração
npm run start:dev        # http://localhost:3333 (health: /health)
```

### 3. Front-end

Em outro terminal:

```bash
cd vite-ui
npm install
cp .env.example .env
```

Ajuste `VITE_API_URL` no `.env` para a porta da API (ex.: `http://localhost:3333`; o exemplo vem com `3000`). Depois:

```bash
npm run dev              # http://localhost:5173
```

## Scripts

### `api/`

| Comando | O que faz |
| --- | --- |
| `npm run start:dev` | Sobe a API com watch |
| `npm run build` / `npm run start:prod` | Compila e roda `dist/main` |
| `npm run lint` | Lint com oxlint |
| `npm run format` | Formata com Prettier |
| `npm test` / `npm run test:e2e` | Testes unitários / e2e (Jest) |
| `npm run db:generate` | Gera migration a partir do schema |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:push` | Sincroniza o schema direto (dev) |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run db:seed` (ou `db:seed:moods` / `plans` / `contents` / `users`) | Seeds |

### `vite-ui/`

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Type-check (`tsc -b`) + build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint |

## Pacotes instalados

### API (`api/`)

**Dependências**

| Pacote | Uso |
| --- | --- |
| `@nestjs/common`, `core`, `platform-express` | Framework (NestJS 12 sobre Express) |
| `@nestjs/config` | Variáveis de ambiente |
| `@nestjs/jwt` | Emissão e validação de JWT |
| `@nestjs/throttler` | Rate limit |
| `drizzle-orm`, `drizzle-kit` | ORM e migrations |
| `pg` | Driver PostgreSQL |
| `argon2` | Hash de senhas |
| `helmet` | Headers de segurança |
| `cookie-parser` | Leitura de cookies |
| `zod` | Validação de entrada e do env |
| `reflect-metadata`, `rxjs` | Requisitos do NestJS |

**Desenvolvimento**: `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`, `@nestjs/mau`, `typescript`, `jest`, `ts-jest`, `supertest`, `oxlint`, `prettier`, `ts-node`, `ts-loader`, `tsconfig-paths`, `source-map-support` e os `@types/*`.

### Front-end (`vite-ui/`)

**Dependências**

| Pacote | Uso |
| --- | --- |
| `react`, `react-dom` | UI (React 19) |
| `@tanstack/react-router` | Rotas por arquivo (`src/routes`) |
| `@tanstack/react-query` | Cache e estado de servidor |
| `axios` | Cliente HTTP (`src/lib/api.js`) |
| `zustand` | Store de autenticação persistida |
| `react-hook-form`, `@hookform/resolvers`, `zod` | Formulários e validação |
| `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css` | Estilos (Tailwind 4) |
| `shadcn`, `@base-ui/react`, `class-variance-authority`, `cn` | Componentes de UI e variantes |
| `lucide-react` | Ícones |
| `next-themes` | Tema claro/escuro |
| `sonner` | Toasts |
| `@fontsource-variable/geist` | Fonte Geist |

**Desenvolvimento**: `vite`, `@vitejs/plugin-react`, `@tanstack/router-plugin`, `vite-plugin-pwa`, `workbox-window`, `typescript`, `eslint` (+ `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@eslint/js`, `globals`) e os `@types/*`.

## Estrutura

```
clavis/
├── api/                  # NestJS: módulos auth, users, moods, check-ins,
│   └── src/              # daily-contents, plans, user-plans, today, journey, health
├── vite-ui/
│   └── src/
│       ├── routes/       # _auth (login, cadastro) e _app (home, hoje, checkin,
│       │                 #   planos, jornada, buscar, perfil)
│       ├── services/     # chamadas à API
│       ├── stores/       # zustand (auth)
│       ├── schemas/      # schemas zod dos formulários
│       └── components/   # UI (shadcn) e componentes por feature
└── docker-compose.yml    # vazio por enquanto
```
