import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DailyContentsRepository } from '../../domain/repositories/daily-contents.repository';
import { CreateDailyContentDTO } from '../../presentation/http/controllers/schemas/create-daily-content.schema';

@Injectable()
export class DailyContentsService {
  constructor(
    private readonly dailyContentsRepository: DailyContentsRepository,
  ) {}

  public async list(moodId?: string) {
    if (moodId) {
      return this.dailyContentsRepository.getAllByMoodId(moodId);
    }

    return this.dailyContentsRepository.getAll();
  }

  public async findById(id: string) {
    const content = await this.dailyContentsRepository.findById(id);

    if (!content) {
      throw new NotFoundException('O conteúdo informado não foi encontrado.');
    }

    const moods = await this.dailyContentsRepository.getMoodsByContentId(id);

    return { ...content, moods };
  }

  public async create(data: CreateDailyContentDTO) {
    const moodIds = [...new Set(data.mood_ids ?? [])];
    await this.assertMoodsExist(moodIds);

    return this.dailyContentsRepository.create(
      {
        title: data.title,
        reflection: data.reflection,
        practice: data.practice,
        durationMin: data.duration_min,
        isDemo: data.is_demo,
      },
      moodIds,
    );
  }

  public async setMoods(id: string, moodIds: string[]) {
    const content = await this.dailyContentsRepository.findById(id);

    if (!content) {
      throw new NotFoundException('O conteúdo informado não foi encontrado.');
    }

    const uniqueMoodIds = [...new Set(moodIds)];
    await this.assertMoodsExist(uniqueMoodIds);

    await this.dailyContentsRepository.setMoods(id, uniqueMoodIds);

    return this.findById(id);
  }

  private async assertMoodsExist(moodIds: string[]) {
    if (moodIds.length === 0) return;

    const found = await this.dailyContentsRepository.countMoodsByIds(moodIds);

    if (found !== moodIds.length) {
      throw new BadRequestException(
        "Um ou mais 'moods' informados não foram encontrados.",
      );
    }
  }
}
