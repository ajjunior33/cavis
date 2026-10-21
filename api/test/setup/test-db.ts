import { existsSync } from 'node:fs';

// Os testes e2e NUNCA rodam contra o banco de desenvolvimento: usamos
// TEST_DATABASE_URL ou, se ausente, o DATABASE_URL com sufixo "_test" no nome.
export function getTestDatabaseUrl(): string {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const url = new URL(
    process.env.TEST_DATABASE_URL ??
      deriveTestUrl(process.env.DATABASE_URL ?? ''),
  );

  if (!url.pathname.slice(1).endsWith('_test')) {
    throw new Error('O banco de testes deve ter o nome terminado em "_test".');
  }

  return url.toString();
}

function deriveTestUrl(databaseUrl: string): string {
  if (!databaseUrl) {
    throw new Error('Defina DATABASE_URL ou TEST_DATABASE_URL.');
  }

  const url = new URL(databaseUrl);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}
