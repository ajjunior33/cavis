# Clavis — Front-end

PWA mobile first do **Clavis**, app de bem-estar emocional (check-in de humor, conteúdo do dia, planos temáticos e jornada). Consome a API em [`../api`](../api). Visão geral do projeto em [`../README.md`](../README.md).

## Executar

Requer Node.js 24+ e a API rodando.

```bash
npm install
cp .env.example .env     # ajuste VITE_API_URL para a URL da API
npm run dev              # http://localhost:5173
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `tsc -b` + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint |

## Variáveis de ambiente

| Variável | Exemplo | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3333` | URL base da API. Também gera a regra `NetworkOnly` do service worker |

## Stack

React 19 · Vite 8 · TanStack Router (rotas por arquivo, `src/routes`) · TanStack Query · Zustand · React Hook Form + Zod · Tailwind 4 · shadcn/Base UI · Axios · vite-plugin-pwa.

Lista completa de pacotes no [README da raiz](../README.md#pacotes-instalados).

## Rotas

| Rota | Tela |
| --- | --- |
| `/login`, `/cadastro` | Autenticação |
| `/home`, `/hoje` | Início e conteúdo do dia |
| `/checkin` | Check-in de humor |
| `/planos`, `/planos/$planId` | Lista e detalhe dos planos |
| `/jornada` | Check-ins recentes e progresso |
| `/buscar` | Busca |
| `/perfil` | Dados do usuário e troca de senha |

`src/routeTree.gen.js` é gerado pelo plugin do TanStack Router; não edite à mão.

## PWA

O app é instalável e o shell fica em precache. Respostas da API **nunca** são cacheadas (`NetworkOnly`). Os ícones são gerados por `scripts/generate-icons.mjs`.
