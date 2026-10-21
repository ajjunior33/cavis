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

  /**
   * Escolhe o conteúdo do dia para um mood. A escolha é determinística por
   * data, então o usuário vê o mesmo conteúdo durante todo o dia.
   */
  public async pickForMood(moodId: string, localDate: string) {
    const contents = await this.dailyContentsRepository.getAllByMoodId(moodId);

    if (contents.length === 0) return null;

    const sorted = [...contents].sort((a, b) => a.id.localeCompare(b.id));
    const dayIndex = Math.floor(Date.parse(localDate) / 86_400_000);

    return sorted[dayIndex % sorted.length];
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
