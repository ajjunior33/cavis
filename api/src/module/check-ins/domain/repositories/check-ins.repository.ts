import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
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

  public async getAllByUserId(userId: string) {
    const list = await this.drizzleService.db
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
      .orderBy(desc(CHECK_INS.checkedAt));

    return list;
  }

  public async create(values: NewCheckIn): Promise<CheckIn> {
    const [checkIn] = await this.drizzleService.db
      .insert(CHECK_INS)
      .values(values)
      .returning();

    return checkIn;
  }
}
