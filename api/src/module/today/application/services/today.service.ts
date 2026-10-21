import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckInsService } from '../../../check-ins/application/services/check-ins.service';
import { DailyContentsService } from '../../../daily-contents/application/services/daily-contents.service';

@Injectable()
export class TodayService {
  constructor(
    private readonly checkInsService: CheckInsService,
    private readonly dailyContentsService: DailyContentsService,
  ) {}

  public async getToday(userId: string) {
    const checkIn = await this.checkInsService.findLatestOfToday(userId);

    if (!checkIn) {
      throw new NotFoundException(
        'Você ainda não fez o check-in de hoje. Faça o check-in para receber o conteúdo do dia.',
      );
    }

    const content = await this.dailyContentsService.pickForMood(
      checkIn.mood.id,
      checkIn.localDate,
    );

    if (!content) {
      throw new NotFoundException(
        'Ainda não há conteúdo disponível para o seu estado de hoje.',
      );
    }

    return {
      checkIn,
      content: await this.dailyContentsService.findById(content.id),
    };
  }
}
