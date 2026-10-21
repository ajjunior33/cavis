import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import { CONTENT_MOODS } from '../../../../shared/database/drizzle/schema/content-moods';
import {
  DAILY_CONTENTS,
  DailyContent,
  NewDailyContent,
} from '../../../../shared/database/drizzle/schema/daily-contents';
import { MOODS } from '../../../../shared/database/drizzle/schema/moods';

@Injectable()
export class DailyContentsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async getAll(): Promise<DailyContent[]> {
    return this.drizzleService.db.select().from(DAILY_CONTENTS);
  }

  public async getAllByMoodId(moodId: string): Promise<DailyContent[]> {
    const list = await this.drizzleService.db
      .select({ content: DAILY_CONTENTS })
      .from(DAILY_CONTENTS)
      .innerJoin(CONTENT_MOODS, eq(CONTENT_MOODS.contentId, DAILY_CONTENTS.id))
      .where(eq(CONTENT_MOODS.moodId, moodId));

    return list.map((row) => row.content);
  }

  public async findById(id: string): Promise<DailyContent | null> {
    const [content] = await this.drizzleService.db
      .select()
      .from(DAILY_CONTENTS)
      .where(eq(DAILY_CONTENTS.id, id));

    return content || null;
  }

  public async getMoodsByContentId(contentId: string) {
    return this.drizzleService.db
      .select({
        id: MOODS.id,
        slug: MOODS.slug,
        label: MOODS.label,
        emoji: MOODS.emoji,
      })
      .from(CONTENT_MOODS)
      .innerJoin(MOODS, eq(MOODS.id, CONTENT_MOODS.moodId))
      .where(eq(CONTENT_MOODS.contentId, contentId));
  }

  public async countMoodsByIds(moodIds: string[]): Promise<number> {
    if (moodIds.length === 0) return 0;

    const rows = await this.drizzleService.db
      .select({ id: MOODS.id })
      .from(MOODS)
      .where(inArray(MOODS.id, moodIds));

    return rows.length;
  }

  public async create(
    values: NewDailyContent,
    moodIds: string[],
  ): Promise<DailyContent> {
    return this.drizzleService.db.transaction(async (tx) => {
      const [content] = await tx
        .insert(DAILY_CONTENTS)
        .values(values)
        .returning();

      if (moodIds.length > 0) {
        await tx
          .insert(CONTENT_MOODS)
          .values(moodIds.map((moodId) => ({ contentId: content.id, moodId })));
      }

      return content;
    });
  }

  public async setMoods(contentId: string, moodIds: string[]): Promise<void> {
    await this.drizzleService.db.transaction(async (tx) => {
      await tx
        .delete(CONTENT_MOODS)
        .where(eq(CONTENT_MOODS.contentId, contentId));

      if (moodIds.length > 0) {
        await tx
          .insert(CONTENT_MOODS)
          .values(moodIds.map((moodId) => ({ contentId, moodId })));
      }
    });
  }
}
