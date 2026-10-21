import { Injectable } from '@nestjs/common';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import {
  NewUser,
  SafeUser,
  User,
  USERS,
} from '../../../../shared/database/drizzle/schema/users';

// Todas as colunas, exceto password_hash. Nunca selecionar o hash em leituras públicas.
const { password_hash: _passwordHash, ...SAFE_COLUMNS } =
  getTableColumns(USERS);

export type UserWithPasswordHash = Pick<
  User,
  'id' | 'password_hash' | 'isDemo'
>;

@Injectable()
export class UsersRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(values: NewUser): Promise<SafeUser> {
    const [user] = await this.drizzleService.db
      .insert(USERS)
      .values(values)
      .returning(SAFE_COLUMNS);

    return user;
  }

  public async findById(id: string): Promise<SafeUser | null> {
    const [user] = await this.drizzleService.db
      .select(SAFE_COLUMNS)
      .from(USERS)
      .where(and(eq(USERS.id, id), isNull(USERS.deletedAt)));

    return user ?? null;
  }

  // Somente para a troca de senha: devolve o hash e o mínimo necessário.
  public async findByIdWithPasswordHash(
    id: string,
  ): Promise<UserWithPasswordHash | null> {
    const [user] = await this.drizzleService.db
      .select({
        id: USERS.id,
        password_hash: USERS.password_hash,
        isDemo: USERS.isDemo,
      })
      .from(USERS)
      .where(and(eq(USERS.id, id), isNull(USERS.deletedAt)));

    return user ?? null;
  }

  public async updateName(id: string, name: string): Promise<SafeUser | null> {
    const [user] = await this.drizzleService.db
      .update(USERS)
      .set({ name })
      .where(and(eq(USERS.id, id), isNull(USERS.deletedAt)))
      .returning(SAFE_COLUMNS);

    return user ?? null;
  }

  // updatedAt é atualizado automaticamente pelo $onUpdate do schema.
  public async updatePasswordHash(
    id: string,
    passwordHash: string,
  ): Promise<boolean> {
    const updated = await this.drizzleService.db
      .update(USERS)
      .set({ password_hash: passwordHash })
      .where(and(eq(USERS.id, id), isNull(USERS.deletedAt)))
      .returning({ id: USERS.id });

    return updated.length > 0;
  }

  // Sem filtro de deletedAt de propósito: o e-mail é único no banco inclusive
  // para contas soft-deletadas, então o cadastro precisa enxergá-las.
  public async findByEmail(email: string): Promise<SafeUser | null> {
    const [user] = await this.drizzleService.db
      .select(SAFE_COLUMNS)
      .from(USERS)
      .where(eq(USERS.email, email));

    return user ?? null;
  }

  // Usado no login: conta soft-deletada não autentica.
  public async findByEmailWithPassword(email: string): Promise<User | null> {
    const [user] = await this.drizzleService.db
      .select()
      .from(USERS)
      .where(and(eq(USERS.email, email), isNull(USERS.deletedAt)));

    return user ?? null;
  }
}
