# Ícones do PWA (placeholders)

Estes PNGs foram gerados por `scripts/generate-icons.mjs` e servem só para o app
ser instalável. **Troque pelo logo real mantendo os mesmos nomes e tamanhos** —
nenhuma configuração precisa mudar.

| Arquivo                  | Tamanho | Uso (manifest)      | Observação                                                                 |
| ------------------------ | ------- | ------------------- | -------------------------------------------------------------------------- |
| `icon-192.png`           | 192x192 | `purpose: any`      | Ícone padrão (Android/Chrome). Pode ter cantos arredondados/transparência. |
| `icon-512.png`           | 512x512 | `purpose: any`      | Splash screen e loja.                                                      |
| `icon-maskable-512.png`  | 512x512 | `purpose: maskable` | Quadrado **cheio**; o símbolo deve ficar no círculo central de 80% (safe zone). Teste em https://maskable.app |
| `apple-touch-icon.png`   | 180x180 | `<link>` no HTML    | iOS aplica os cantos sozinho: use quadrado cheio, sem transparência.       |

Outros pontos a trocar:

- `public/favicon.svg` — favicon da aba.
- Cores da marca: `theme_color` / `background_color` em `vite.config.ts`, a meta
  `theme-color` em `index.html` e `--surface` em `src/index.css`.
- Nome do app: `name` / `short_name` / `description` em `vite.config.ts` e `<title>` em `index.html`.

Para regenerar os placeholders: `node scripts/generate-icons.mjs`.
