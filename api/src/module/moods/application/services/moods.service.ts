import { BadRequestException, Injectable } from '@nestjs/common';
import { slugify } from '../../../health/application/functions/slugify';
import { MoodsRepository } from '../../domain/repositories/moods.repository';
import { CreateMoodDTO } from '../../presentation/http/controllers/schemas/create-mood.schema';

@Injectable()
export class MoodsService {
  constructor(private readonly moodsRepository: MoodsRepository) {}

  public async list() {
    return this.moodsRepository.getAll();
  }

  public async findById(id: string) {
    return this.moodsRepository.findById(id);
  }

  public async create(data: CreateMoodDTO) {
    const moodSlug = slugify(data.label);
    const mood = await this.moodsRepository.findBySlug(moodSlug);

    if (mood) {
      throw new BadRequestException("Já existe um 'mood' com esse nome.");
    }

    const create = await this.moodsRepository.create({
      ...data,
      slug: moodSlug,
    });

    return create;
  }
}
