import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DrizzleService } from '../src/shared/database/drizzle/drizzle.service';
import { USERS } from '../src/shared/database/drizzle/schema/users';

const PASSWORD = 'Senha1234';

describe('Perfil do usuário (/users/me) (e2e)', () => {
  let app: INestApplication<App>;
  let db: DrizzleService['db'];

  const http = () => request(app.getHttpServer());

  async function createUser(overrides: { name?: string } = {}) {
    const email = `${randomUUID()}@teste.com`;
    const name = overrides.name ?? 'Maria Teste';

    const created = await http()
      .post('/users')
      .send({ name, email, password: PASSWORD })
      .expect(201);

    const login = await http()
      .post('/auth')
      .send({ email, password: PASSWORD })
      .expect(201);

    return {
      id: created.body.id as string,
      email,
      token: login.body.access_token as string,
    };
  }

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(DrizzleService).db;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('retorna o perfil em snake_case, sem hash, updatedAt nem deletedAt', async () => {
      const user = await createUser();

      const res = await http()
        .get('/users/me')
        .set(auth(user.token))
        .expect(200);

      expect(Object.keys(res.body).sort()).toEqual(
        ['created_at', 'email', 'id', 'is_demo', 'name', 'role'].sort(),
      );
      expect(res.body).toMatchObject({
        id: user.id,
        name: 'Maria Teste',
        email: user.email,
        role: 'USER',
        is_demo: false,
      });
      expect(new Date(res.body.created_at).getTime()).not.toBeNaN();

      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain('password');
      expect(raw).not.toContain('argon2');
      expect(res.body).not.toHaveProperty('updatedAt');
      expect(res.body).not.toHaveProperty('deletedAt');
    });

    it('sem token -> 401', async () => {
      const res = await http().get('/users/me').expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('usuário soft-deletado com token ainda válido -> 401', async () => {
      const user = await createUser();
      await db
        .update(USERS)
        .set({ deletedAt: new Date() })
        .where(eq(USERS.id, user.id));

      const res = await http().get('/users/me').set(auth(user.token));

      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('usuário soft-deletado não consegue mais fazer login', async () => {
      const user = await createUser();
      await db
        .update(USERS)
        .set({ deletedAt: new Date() })
        .where(eq(USERS.id, user.id));

      await http()
        .post('/auth')
        .send({ email: user.email, password: PASSWORD })
        .expect(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('atualiza o nome (com trim) e persiste', async () => {
      const user = await createUser();

      const res = await http()
        .patch('/users/me')
        .set(auth(user.token))
        .send({ name: '  Novo Nome  ' })
        .expect(200);

      expect(res.body.name).toBe('Novo Nome');
      expect(res.body).not.toHaveProperty('updatedAt');

      const me = await http()
        .get('/users/me')
        .set(auth(user.token))
        .expect(200);
      expect(me.body.name).toBe('Novo Nome');
    });

    it.each([
      ['role', { role: 'SUPER_ADMIN' }],
      ['email', { email: 'outro@teste.com' }],
      ['isDemo', { isDemo: true }],
      ['id', { id: randomUUID() }],
      ['deletedAt', { deletedAt: null }],
    ])(
      'rejeita o campo %s com 400 e não altera nada',
      async (_field, extra) => {
        const user = await createUser();

        const res = await http()
          .patch('/users/me')
          .set(auth(user.token))
          .send({ name: 'Nome Válido', ...extra })
          .expect(400);

        expect(res.body.statusCode).toBe(400);
        expect(res.body.details).toEqual(expect.any(Array));

        const me = await http()
          .get('/users/me')
          .set(auth(user.token))
          .expect(200);
        expect(me.body).toMatchObject({
          name: 'Maria Teste',
          email: user.email,
          role: 'USER',
          is_demo: false,
        });
      },
    );

    it.each([[''], ['a'], [' a '], ['x'.repeat(81)]])(
      'nome inválido (%j) -> 400',
      async (name) => {
        const user = await createUser();

        await http()
          .patch('/users/me')
          .set(auth(user.token))
          .send({ name })
          .expect(400);
      },
    );

    it('sem token -> 401', async () => {
      await http().patch('/users/me').send({ name: 'Fulano' }).expect(401);
    });

    it('isolamento: alterar o usuário A não afeta o usuário B', async () => {
      const a = await createUser({ name: 'Usuário A' });
      const b = await createUser({ name: 'Usuário B' });

      await http()
        .patch('/users/me')
        .set(auth(a.token))
        .send({ name: 'A Alterado' })
        .expect(200);

      const meB = await http().get('/users/me').set(auth(b.token)).expect(200);
      expect(meB.body.name).toBe('Usuário B');

      const meA = await http().get('/users/me').set(auth(a.token)).expect(200);
      expect(meA.body.name).toBe('A Alterado');
    });

    it('conta demo pode alterar o nome', async () => {
      const user = await createUser();
      await db.update(USERS).set({ isDemo: true }).where(eq(USERS.id, user.id));

      const res = await http()
        .patch('/users/me')
        .set(auth(user.token))
        .send({ name: 'Demo Renomeado' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Demo Renomeado', is_demo: true });
    });
  });

  describe('PATCH /users/me/password', () => {
    const NEW_PASSWORD = 'NovaSenha99';

    const changePassword = (token: string, body: object) =>
      http().patch('/users/me/password').set(auth(token)).send(body);

    it('troca a senha: 204 sem corpo; login novo funciona e o antigo falha', async () => {
      const user = await createUser();

      const res = await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: NEW_PASSWORD,
      }).expect(204);
      expect(res.text).toBe('');

      await http()
        .post('/auth')
        .send({ email: user.email, password: NEW_PASSWORD })
        .expect(201);
      await http()
        .post('/auth')
        .send({ email: user.email, password: PASSWORD })
        .expect(401);
    });

    it('senha atual errada -> 401 "Senha atual incorreta" e senha não muda', async () => {
      const user = await createUser();

      const res = await changePassword(user.token, {
        current_password: 'Errada1234',
        new_password: NEW_PASSWORD,
      }).expect(401);

      expect(res.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Senha atual incorreta',
      });

      await http()
        .post('/auth')
        .send({ email: user.email, password: PASSWORD })
        .expect(201);
    });

    it.each([
      ['curta', 'Ab1'],
      ['sem minúscula', 'SEMMINUSCULA1'],
      ['sem maiúscula', 'semmaiuscula1'],
      ['sem número', 'SemNumeroAqui'],
    ])('nova senha fraca (%s) -> 400', async (_label, weak) => {
      const user = await createUser();

      const res = await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: weak,
      }).expect(400);

      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'new_password' }),
        ]),
      );
    });

    it('nova senha igual à atual -> 400', async () => {
      const user = await createUser();

      const res = await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: PASSWORD,
      }).expect(400);

      expect(res.body.details).toEqual([
        {
          path: 'new_password',
          message: 'A nova senha deve ser diferente da senha atual',
        },
      ]);
    });

    it('campos ausentes ou desconhecidos -> 400', async () => {
      const user = await createUser();

      await changePassword(user.token, { new_password: NEW_PASSWORD }).expect(
        400,
      );
      await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: NEW_PASSWORD,
        role: 'SUPER_ADMIN',
      }).expect(400);
    });

    it('conta demo -> 403 e senha não muda', async () => {
      const user = await createUser();
      await db.update(USERS).set({ isDemo: true }).where(eq(USERS.id, user.id));

      const res = await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: NEW_PASSWORD,
      }).expect(403);

      expect(res.body).toMatchObject({
        statusCode: 403,
        message: 'A senha da conta de demonstração não pode ser alterada',
      });

      await http()
        .post('/auth')
        .send({ email: user.email, password: PASSWORD })
        .expect(201);
    });

    it('sem token -> 401', async () => {
      await http()
        .patch('/users/me/password')
        .send({ current_password: PASSWORD, new_password: NEW_PASSWORD })
        .expect(401);
    });

    it('usuário soft-deletado -> 401', async () => {
      const user = await createUser();
      await db
        .update(USERS)
        .set({ deletedAt: new Date() })
        .where(eq(USERS.id, user.id));

      await changePassword(user.token, {
        current_password: PASSWORD,
        new_password: NEW_PASSWORD,
      }).expect(401);
    });

    it('rate limit: a 6ª tentativa no minuto -> 429, sem afetar outro usuário', async () => {
      const user = await createUser();
      const other = await createUser();

      for (let i = 0; i < 5; i++) {
        await changePassword(user.token, {
          current_password: 'Errada1234',
          new_password: NEW_PASSWORD,
        }).expect(401);
      }

      const res = await changePassword(user.token, {
        current_password: 'Errada1234',
        new_password: NEW_PASSWORD,
      }).expect(429);
      expect(res.body.statusCode).toBe(429);
      expect(res.body.error).toBe('Too Many Requests');

      await changePassword(other.token, {
        current_password: 'Errada1234',
        new_password: NEW_PASSWORD,
      }).expect(401);
    });
  });

  it('o hash nunca aparece em respostas de erro nem no cadastro de usuário', async () => {
    const email = `${randomUUID()}@teste.com`;

    const created = await http()
      .post('/users')
      .send({ name: 'Maria Teste', email, password: PASSWORD })
      .expect(201);
    expect(JSON.stringify(created.body)).not.toMatch(/password|argon2/);

    const duplicate = await http()
      .post('/users')
      .send({ name: 'Maria Teste', email, password: PASSWORD })
      .expect(400);
    expect(JSON.stringify(duplicate.body)).not.toMatch(/argon2/);
  });
});
