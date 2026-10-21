import { Injectable, NotFoundException } from '@nestjs/common';
import { MoodsService } from '../../../moods/application/services/moods.service';
import { CheckInsRepository } from '../../domain/repositories/check-ins.repository';
import { CreateCheckInDTO } from '../../presentation/http/controllers/schemas/create-check-in.schema';

const TIMEZONE = 'America/Sao_Paulo';

@Injectable()
export class CheckInsService {
  constructor(
    private readonly checkInsRepository: CheckInsRepository,
    private readonly moodsService: MoodsService,
  ) {}

  public async list(userId: string, limit?: number) {
    return this.checkInsRepository.getAllByUserId(userId, limit);
  }

  public async create(userId: string, data: CreateCheckInDTO) {
    const mood = await this.moodsService.findById(data.mood_id);

    if (!mood) {
      throw new NotFoundException("O 'mood' informado não foi encontrado.");
    }

    const localDate = this.getTodayLocalDate();

    return this.checkInsRepository.create({
      userId,
      moodId: data.mood_id,
      note: data.note,
      localDate,
    });
  }

  public async findLatestOfToday(userId: string) {
    return this.checkInsRepository.findLatestByUserIdAndLocalDate(
      userId,
      this.getTodayLocalDate(),
    );
  }

  public getTodayLocalDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  }
}
