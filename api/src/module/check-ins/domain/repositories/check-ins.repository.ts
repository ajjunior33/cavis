import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import {
  CHECK_INS,
  CheckIn,
  NewCheckIn,
} from '../../../../shared/database/drizzle/schema/check-ins';
import { MOODS } from '../../../../shared/database/drizzle/schema/moods';

@Injectable()
export class CheckInsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async getAllByUserId(userId: string, limit?: number) {
    const query = this.drizzleService.db
      .select({
        id: CHECK_INS.id,
        note: CHECK_INS.note,
        checkedAt: CHECK_INS.checkedAt,
        localDate: CHECK_INS.localDate,
        mood: {
          id: MOODS.id,
          slug: MOODS.slug,
          label: MOODS.label,
          emoji: MOODS.emoji,
        },
      })
      .from(CHECK_INS)
      .innerJoin(MOODS, eq(MOODS.id, CHECK_INS.moodId))
      .where(eq(CHECK_INS.userId, userId))
      .orderBy(desc(CHECK_INS.checkedAt))
      .$dynamic();

    return limit ? query.limit(limit) : query;
  }

  public async findLatestByUserIdAndLocalDate(
    userId: string,
    localDate: string,
  ) {
    const [checkIn] = await this.drizzleService.db
      .select({
        id: CHECK_INS.id,
        note: CHECK_INS.note,
        checkedAt: CHECK_INS.checkedAt,
        localDate: CHECK_INS.localDate,
        mood: {
          id: MOODS.id,
          slug: MOODS.slug,
          label: MOODS.label,
          emoji: MOODS.emoji,
        },
      })
      .from(CHECK_INS)
      .innerJoin(MOODS, eq(MOODS.id, CHECK_INS.moodId))
      .where(
        and(eq(CHECK_INS.userId, userId), eq(CHECK_INS.localDate, localDate)),
      )
      .orderBy(desc(CHECK_INS.checkedAt))
      .limit(1);

    return checkIn || null;
  }

  public async create(values: NewCheckIn): Promise<CheckIn> {
    const [checkIn] = await this.drizzleService.db
      .insert(CHECK_INS)
      .values(values)
      .returning();

    return checkIn;
  }
}
