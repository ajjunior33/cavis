import { getTestDatabaseUrl } from './test-db';

// Roda em cada worker antes dos testes; o ConfigModule respeita o process.env.
process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.NODE_ENV = 'test';
