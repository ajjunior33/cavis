# Clavis API

API REST do **Clavis**, um app de bem-estar emocional. O usuário registra como se sente (check-in de humor), recebe um conteúdo de reflexão + prática adequado ao estado do dia e acompanha planos temáticos de vários dias (respiração, gratidão, sono…), com progresso salvo.

O front-end (React + Vite, PWA) fica em [`../vite-ui`](../vite-ui).

## Sumário

- [O que é o projeto](#o-que-é-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Modelagem do banco](#modelagem-do-banco)
- [Endpoints e roles](#endpoints-e-roles)
- [Setup](#setup)
- [Scripts](#scripts)
- [Testes](#testes)
- [Segurança e decisões](#segurança-e-decisões)
- [Pendências conhecidas](#pendências-conhecidas)

---

## O que é o projeto

O fluxo central do app:

1. **Check-in de humor** — o usuário escolhe um _mood_ (ex.: ansioso, calmo) e, opcionalmente, escreve uma nota.
2. **Conteúdo do dia** — com base no mood do último check-in do dia, a API escolhe um conteúdo (reflexão + prática). A escolha é determinística por data: o usuário vê o mesmo conteúdo o dia inteiro.
3. **Planos temáticos** — séries de N dias (ex.: _Respirar e Acalmar_, _Gratidão em 7 dias_, _Sono Tranquilo_). O usuário se inscreve, marca cada dia como concluído e o plano é finalizado automaticamente ao completar todos os dias.
4. **Jornada** — visão agregada: últimos check-ins + progresso (%) em cada plano.

O "dia" do usuário é calculado no fuso `America/Sao_Paulo`.

Existem dois perfis: `USER` (padrão) e `SUPER_ADMIN`, que administra o catálogo (moods, conteúdos e planos).

---

## Tecnologias

| Camada          | Tecnologia                                                              |
| --------------- | ----------------------------------------------------------------------- |
| Runtime         | Node.js 24, TypeScript 6                                                |
| Framework       | [NestJS 12](https://nestjs.com) (Express)                               |
| Banco de dados  | PostgreSQL                                                              |
| ORM / migrações | [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit, driver `pg`      |
| Validação       | [Zod 4](https://zod.dev) (env, body, query e params via `ZodValidationPipe`) |
| Autenticação    | JWT (`@nestjs/jwt`) no header `Authorization: Bearer`                   |
| Hash de senha   | [argon2](https://github.com/ranisalt/node-argon2)                       |
| Segurança HTTP  | `helmet`, CORS com credenciais, `cookie-parser`, `@nestjs/throttler`    |
| Lint / formato  | oxlint, Prettier                                                        |
| Testes          | Jest 30, ts-jest, Supertest (e2e contra Postgres real)                  |
| Seeds           | `tsx`                                                                   |

---

## Arquitetura

Monólito modular do NestJS. Cada módulo segue a mesma divisão em camadas:

```
src/
├── main.ts                      # bootstrap (helmet, cors, cookies)
├── app.module.ts                # módulos + AuthGuard global + filtro de exceções global
├── config/
│   └── env.ts                   # schema Zod das variáveis de ambiente
├── module/
│   └── <modulo>/
│       ├── <modulo>.module.ts
│       ├── application/services/        # regras de negócio
│       ├── domain/repositories/         # acesso a dados (Drizzle)
│       └── presentation/http/
│           ├── controllers/             # rotas
│           └── schemas/                 # DTOs em Zod
└── shared/
    ├── database/
    │   ├── drizzle/schema/      # tabelas
    │   ├── migrations/          # SQL gerado pelo drizzle-kit
    │   └── seeds/               # planos e usuário demo
    ├── decorators/public.decorator.ts   # @Public() libera rota sem token
    ├── filters/all-exceptions.filter.ts # erros no formato { statusCode, error, message, details? }
    ├── guards/                          # AdminGuard, UserThrottlerGuard
    └── pipes/                           # ZodValidationPipe, regras de senha
```

Módulos: `auth`, `users`, `moods`, `check-ins`, `daily-contents`, `plans`, `user-plans`, `today`, `journey`, `health`.

---

## Modelagem do banco

```mermaid
erDiagram
    users ||--o{ check_ins : "registra"
    moods ||--o{ check_ins : "classifica"
    moods ||--o{ content_moods : ""
    daily_contents ||--o{ content_moods : ""
    users ||--o{ user_plans : "inscreve-se"
    plans ||--o{ user_plans : ""
    plans ||--o{ plan_days : "possui"
    user_plans ||--o{ plan_day_completions : "progresso"
    plan_days ||--o{ plan_day_completions : ""

    users {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role "USER | SUPER_ADMIN"
        boolean is_demo
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    moods {
        uuid id PK
        varchar slug UK
        varchar label
        varchar emoji
        integer soft_order
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    check_ins {
        uuid id PK
        uuid user_id FK
        uuid mood_id FK
        text note
        timestamptz checked_at
        date local_date
    }
    daily_contents {
        uuid id PK
        text title
        text reflection
        text practice
        integer duration_min
        boolean is_demo
    }
    content_moods {
        uuid content_id PK,FK
        uuid mood_id PK,FK
    }
    plans {
        uuid id PK
        text slug UK
        text title
        text description
        integer total_days
        boolean is_demo
    }
    plan_days {
        uuid id PK
        uuid plan_id FK
        integer day_number
        text title
        text content
        text practice
    }
    user_plans {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        timestamptz started_at
        timestamptz completed_at
    }
    plan_day_completions {
        uuid id PK
        uuid user_plan_id FK
        uuid plan_day_id FK
        timestamptz completed_at
    }
```

### Tabelas

| Tabela                 | Papel                                                                              | Restrições relevantes                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `users`                | Contas. `role` define o acesso administrativo; `is_demo` marca a conta de demonstração. | `email` único; soft delete via `deleted_at`                              |
| `moods`                | Catálogo de estados emocionais.                                                    | `slug` único (gerado a partir do `label`); soft delete                   |
| `check_ins`            | Registro de humor do usuário. `local_date` é o dia no fuso `America/Sao_Paulo`.    | Índice `idx_check_ins_user_date (user_id, checked_at DESC)`; `ON DELETE CASCADE` no usuário |
| `daily_contents`       | Conteúdo do dia (reflexão + prática + duração).                                    | —                                                                        |
| `content_moods`        | Relação N:N entre conteúdo e mood (qual conteúdo recomendar para cada estado).     | PK composta `(content_id, mood_id)`; cascade nos dois lados              |
| `plans`                | Planos temáticos.                                                                  | `slug` único                                                             |
| `plan_days`            | Dias de cada plano.                                                                | `UNIQUE (plan_id, day_number)`; cascade no plano                         |
| `user_plans`           | Inscrição do usuário em um plano. `completed_at` é preenchido ao concluir todos os dias. | `UNIQUE (user_id, plan_id)` — uma inscrição por plano                    |
| `plan_day_completions` | Dias concluídos por inscrição.                                                     | `UNIQUE (user_plan_id, plan_day_id)` — torna a conclusão **idempotente** |

Schemas em [`src/shared/database/drizzle/schema/`](src/shared/database/drizzle/schema) · migrações em [`src/shared/database/migrations/`](src/shared/database/migrations).

---

## Endpoints e roles

**Legenda de acesso**

- 🌐 **Público** — sem token.
- 🔒 **USER** — qualquer usuário autenticado (o `AuthGuard` é global; toda rota sem `@Public()` exige `Authorization: Bearer <access_token>`).
- 👑 **SUPER_ADMIN** — autenticado **e** com `role = SUPER_ADMIN` (`AdminGuard`, que consulta o banco a cada requisição). Outro perfil recebe `403`.

Rotas que operam dados do usuário (`/users/me`, `/check-ins`, `/user-plans`, `/today`, `/journey`) sempre usam o `id` extraído do **token**, nunca de parâmetro da requisição.

### Saúde

| Método | Rota      | Acesso    | Descrição                |
| ------ | --------- | --------- | ------------------------ |
| GET    | `/health` | 🌐 Público | Health check da API.     |

### Autenticação e usuários

| Método | Rota                | Acesso     | Descrição                                                                                         |
| ------ | ------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| POST   | `/auth`             | 🌐 Público | Login. Body: `{ email, password }`. Retorna `{ user, access_token }`.                             |
| POST   | `/users`            | 🌐 Público | Cadastro. Body: `{ name, email, password }`. Cria sempre com role `USER`.                         |
| GET    | `/users/me`         | 🔒 USER    | Dados do usuário logado (`id, name, email, role, created_at, is_demo`).                           |
| PATCH  | `/users/me`         | 🔒 USER    | Atualiza o nome (2–80 caracteres). Campos extras são rejeitados (`.strict()`).                    |
| PATCH  | `/users/me/password`| 🔒 USER    | Troca a senha. Body: `{ current_password, new_password }`. `204`. Limite de **5 req/min por usuário**. Bloqueado para a conta demo. |

**Regra de senha:** mínimo 8 caracteres, com ao menos uma letra minúscula, uma maiúscula e um número.

#### Perfil do usuário autenticado (`/users/me`)

Todos exigem `Authorization: Bearer <access_token>`. O corpo/resposta usa `snake_case`.

**`GET /users/me`**

- `200` → `{ "id", "name", "email", "role", "created_at", "is_demo" }`
- `401` sem token, token inválido ou usuário inexistente/soft-deletado.

**`PATCH /users/me`**

- Body: `{ "name": string }` (com `trim`, 2–80 caracteres). Qualquer outro campo (`email`, `role`, `is_demo`, `id`, `deleted_at`…) é rejeitado.
- `200` → mesmo formato do `GET /users/me`, com o nome atualizado.
- `400` validação (`details: [{ path, message }]`) · `401` · permitido também para a conta demo.

**`PATCH /users/me/password`**

- Body: `{ "current_password": string, "new_password": string }`. `new_password` segue a regra de senha acima e precisa ser diferente de `current_password`.
- `204` sem corpo.
- `400` validação · `401` `{ "statusCode": 401, "error": "Unauthorized", "message": "Senha atual incorreta" }` · `403` conta demo (`"A senha da conta de demonstração não pode ser alterada"`) · `429` mais de 5 tentativas por minuto.

> **Segurança:** o hash nunca é exposto (nem em respostas, nem em logs); o `id` vem sempre do token (não existe `/users/:id` para perfil); campos como `role` são imutáveis por esta rota; a troca de senha tem rate limit (5/min por usuário). Usuário soft-deletado com token ainda válido recebe `401` (mesmo padrão do `AdminGuard`) e não consegue logar.

### Moods

| Método | Rota     | Acesso         | Descrição                                                         |
| ------ | -------- | -------------- | ----------------------------------------------------------------- |
| GET    | `/moods` | 🔒 USER        | Lista os moods.                                                   |
| POST   | `/moods` | 👑 SUPER_ADMIN | Cria mood. Body: `{ label, emoji?, soft_order? }`.                |

### Check-ins

| Método | Rota         | Acesso  | Descrição                                                          |
| ------ | ------------ | ------- | ------------------------------------------------------------------ |
| GET    | `/check-ins` | 🔒 USER | Lista os check-ins do usuário.                                     |
| POST   | `/check-ins` | 🔒 USER | Registra check-in. Body: `{ mood_id (uuid), note? }`. `404` se o mood não existir. |

### Conteúdos diários

| Método | Rota                       | Acesso         | Descrição                                                                                  |
| ------ | -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/daily-contents`          | 🔒 USER        | Lista conteúdos. Query opcional: `?mood_id=<uuid>`.                                        |
| GET    | `/daily-contents/:id`      | 🔒 USER        | Detalhe do conteúdo, com os moods associados.                                              |
| POST   | `/daily-contents`          | 👑 SUPER_ADMIN | Cria conteúdo. Body: `{ title, reflection, practice, duration_min?, is_demo?, mood_ids? }`. |
| PUT    | `/daily-contents/:id/moods`| 👑 SUPER_ADMIN | Substitui os moods do conteúdo. Body: `{ mood_ids: uuid[] }`.                              |

### Planos

| Método | Rota                 | Acesso         | Descrição                                                                                                  |
| ------ | -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/plans`             | 🔒 USER        | Lista os planos.                                                                                           |
| GET    | `/plans/:slug`       | 🔒 USER        | Detalhe do plano com todos os dias.                                                                        |
| POST   | `/plans`             | 👑 SUPER_ADMIN | Cria plano. Body: `{ slug (kebab-case), title, description, total_days, is_demo?, days? }`.                |
| POST   | `/plans/:id/days`    | 👑 SUPER_ADMIN | Adiciona um dia. Body: `{ day_number, title, content, practice? }`.                                        |

### Inscrições em planos (progresso)

| Método | Rota                                        | Acesso  | Descrição                                                                                                   |
| ------ | ------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| GET    | `/user-plans`                               | 🔒 USER | Lista as inscrições do usuário (com `completedDays`).                                                       |
| GET    | `/user-plans/:id`                           | 🔒 USER | Detalhe da inscrição: plano, dias e `completedAt` de cada dia. `404` se não for do usuário.                 |
| POST   | `/user-plans`                               | 🔒 USER | Inscreve-se em um plano. Body: `{ plan_id }`. `409` se já inscrito.                                         |
| POST   | `/user-plans/:id/days/:planDayId/complete`  | 🔒 USER | Conclui um dia (idempotente). Marca o plano como concluído quando todos os dias estiverem feitos.           |

### Home e jornada

| Método | Rota       | Acesso  | Descrição                                                                                                                     |
| ------ | ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/today`   | 🔒 USER | Check-in mais recente do dia + conteúdo sugerido para o mood. `404` se ainda não houve check-in hoje ou não há conteúdo.      |
| GET    | `/journey` | 🔒 USER | Check-ins recentes + progresso (%) por plano. Query: `?check_ins_limit=` (1–30, padrão 7).                                    |

### Formato de erro

Todas as exceções passam por um filtro global e saem como:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "...", "details": [] }
```

Mensagens de erro de banco nunca são logadas com parâmetros (evita vazar `password_hash`).

---

## Setup

### Pré-requisitos

- Node.js **24+** e npm
- PostgreSQL 14+ (local ou Docker)

### 1. Instalar dependências

```bash
cd api
npm install
```

> O `argon2` e o `esbuild` precisam rodar scripts de build; eles já estão liberados em `allowScripts` no `package.json`.

### 2. Subir o PostgreSQL

O `docker-compose.yml` da raiz está vazio, então a forma mais rápida é um container avulso:

```bash
docker run -d --name clavis-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=clavis \
  -p 5432:5432 \
  postgres:16
```

### 3. Configurar o `.env`

Crie `api/.env`:

```dotenv
PORT=3333
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clavis

JWT_ACCESS_SECRET=troque-por-um-segredo-longo-e-aleatorio
JWT_REFRESH_SECRET=troque-por-outro-segredo-longo-e-aleatorio
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Obrigatória na validação do env, mas ainda não usada pelo código
REDIS_URL=redis://localhost:6379

# Opcional: origem liberada no CORS (padrão http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

| Variável                                   | Obrigatória | Padrão                  | Descrição                                       |
| ------------------------------------------ | ----------- | ----------------------- | ----------------------------------------------- |
| `DATABASE_URL`                             | ✅          | —                       | String de conexão do PostgreSQL.                |
| `JWT_ACCESS_SECRET`                        | ✅          | —                       | Segredo de assinatura do access token.          |
| `JWT_REFRESH_SECRET`                       | ✅          | —                       | Reservado para refresh token (ainda não usado). |
| `REDIS_URL`                                | ✅          | —                       | Exigida pelo schema do env; sem uso por ora.    |
| `PORT`                                     |             | `3333`                  | Porta HTTP.                                     |
| `NODE_ENV`                                 |             | `development`           | `development`, `production` ou `test`.          |
| `JWT_ACCESS_EXPIRES_IN`                    |             | `15m`                   | Validade do access token.                       |
| `JWT_REFRESH_EXPIRES_IN`                   |             | `7d`                    | Validade do refresh token.                      |
| `FRONTEND_URL`                             |             | `http://localhost:5173` | Origem permitida no CORS.                       |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`   |             | `demo@clavis.app` / `Demo1234` | Usadas só pelo seed do usuário demo. Em produção a senha é obrigatória. |

A API falha ao iniciar, com a lista de campos inválidos, se uma variável obrigatória estiver ausente.

### 4. Criar as tabelas

```bash
npm run db:migrate
```

### 5. Popular dados iniciais (opcional)

```bash
npm run db:seed:plans   # 3 planos: respirar-e-acalmar, gratidao-em-7-dias, sono-tranquilo
npm run db:seed:users   # conta demo (demo@clavis.app) com is_demo = true
```

Não há seed de **moods** nem de **conteúdos diários**: crie-os pelos endpoints de admin (veja abaixo).

### 6. Rodar a API

```bash
npm run start:dev
```

Teste: `curl http://localhost:3333/health` → `{"api":{"status":"OK"}}`.

### 7. Criar um SUPER_ADMIN

O cadastro público cria sempre `USER`. Para administrar o catálogo, cadastre-se por `POST /users` e promova a conta direto no banco:

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'voce@exemplo.com';
```

Faça login de novo (o `role` vai no token) e use o `access_token` nas rotas 👑.

### 8. Front-end (opcional)

```bash
cd ../vite-ui
npm install
echo "VITE_API_URL=http://localhost:3333" > .env.local
npm run dev        # http://localhost:5173
```

---

## Scripts

| Comando                 | O que faz                                              |
| ----------------------- | ------------------------------------------------------ |
| `npm run start:dev`     | API em modo watch.                                     |
| `npm run build`         | Compila para `dist/`.                                  |
| `npm run start:prod`    | Executa `dist/main`.                                   |
| `npm run lint`          | oxlint em `src/` e `test/`.                            |
| `npm run format`        | Prettier em `src/` e `test/`.                          |
| `npm test`              | Testes unitários (Jest).                               |
| `npm run test:cov`      | Cobertura.                                             |
| `npm run test:e2e`      | Testes e2e (precisa de Postgres).                      |
| `npm run db:generate`   | Gera uma nova migração a partir dos schemas Drizzle.   |
| `npm run db:migrate`    | Aplica as migrações pendentes.                         |
| `npm run db:push`       | Sincroniza o schema direto (somente desenvolvimento).  |
| `npm run db:studio`     | Abre o Drizzle Studio.                                 |
| `npm run db:seed:plans` | Seed dos planos.                                       |
| `npm run db:seed:users` | Seed do usuário demo.                                  |

**Fluxo para alterar o banco:** edite o schema em `src/shared/database/drizzle/schema/` → `npm run db:generate` → revise o SQL → `npm run db:migrate`.

---

## Testes

Os testes e2e recriam o banco do zero e aplicam **todas** as migrações a cada execução. Por segurança, **nunca rodam contra o banco de desenvolvimento**:

- usam `TEST_DATABASE_URL`, ou
- derivam de `DATABASE_URL` acrescentando o sufixo `_test` (ex.: `clavis_test`; o banco é criado automaticamente).

O nome do banco de testes precisa terminar em `_test`, senão a execução é abortada.

```bash
npm run test:e2e
```

---

## Segurança e decisões

- **Autenticação global:** `AuthGuard` é `APP_GUARD`; só rotas marcadas com `@Public()` dispensam token.
- **Senhas:** hash com argon2; respostas de login não diferenciam e-mail inexistente de senha errada.
- **Autorização de admin:** `AdminGuard` lê o `role` no banco a cada chamada, então rebaixar um admin vale imediatamente (não depende do token).
- **Isolamento de dados:** o `id` do usuário vem sempre do token; inscrições de outro usuário retornam `404`.
- **Mass assignment:** `PATCH /users/me` e `/users/me/password` usam schemas `.strict()`; a resposta de `/users/me` é uma whitelist explícita (sem `password_hash`, `deleted_at`…).
- **Rate limit:** `UserThrottlerGuard` limita por usuário (cai para IP) — hoje aplicado só à troca de senha (5/min). Armazenamento em memória por instância; com várias instâncias, migrar para Redis.
- **Conta demo:** `is_demo = true` impede a troca de senha.
- **HTTP:** `helmet` ativo, CORS restrito a `FRONTEND_URL` com credenciais.
- **Fuso:** o "dia" do check-in usa `America/Sao_Paulo`.

---

## Pendências conhecidas

- **Refresh token** não implementado: há apenas access token JWT stateless. Trocar a senha não invalida sessões já emitidas até expirarem (ver `TODO` em `users.service.ts`; sugestão: coluna `token_version` conferida no `AuthGuard`).
- **`REDIS_URL`** é exigida pela validação do env, mas nenhum código a usa ainda.
- **`docker-compose.yml`** está vazio.
- Sem seed de moods/conteúdos diários.
