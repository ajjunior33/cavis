import { Injectable } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import {
  Mood,
  MOODS,
  NewMood,
} from '../../../../shared/database/drizzle/schema/moods';

@Injectable()
export class MoodsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async findBySlug(slug: string): Promise<Mood | null> {
    const [mood] = await this.drizzleService.db
      .select()
      .from(MOODS)
      .where(eq(MOODS.slug, slug));

    return mood || null;
  }

  public async getAll(): Promise<Mood[] | []> {
    const list = await this.drizzleService.db
      .select()
      .from(MOODS)
      .where(isNull(MOODS.deletedAt));

    return list;
  }

  public async create(values: NewMood): Promise<Mood> {
    const [mood] = await this.drizzleService.db
      .insert(MOODS)
      .values(values)
      .returning();

    return mood;
  }
}
