import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import {
  NewUser,
  SafeUser,
  User,
  USERS,
} from '../../../../shared/database/drizzle/schema/users';

@Injectable()
export class UsersRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(values: NewUser): Promise<SafeUser> {
    const [user] = await this.drizzleService.db
      .insert(USERS)
      .values(values)
      .returning();

    const { password_hash, ...safeUser } = user;

    return safeUser;
  }

  public async findById(id: string): Promise<SafeUser | null> {
    const [user] = await this.drizzleService.db
      .select()
      .from(USERS)
      .where(eq(USERS.id, id));
    if (!user) return null;

    const { password_hash, ...safeUser } = user;

    return safeUser;
  }

  public async findByEmail(email: string): Promise<SafeUser | null> {
    const [user] = await this.drizzleService.db
      .select()
      .from(USERS)
      .where(eq(USERS.email, email));

    if (!user) return null;

    const { password_hash, ...safeUser } = user;

    return safeUser;
  }

  public async findByEmailWithPassword(email: string): Promise<User | null> {
    const [user] = await this.drizzleService.db
      .select()
      .from(USERS)
      .where(eq(USERS.email, email));

    return user || null;
  }
}
