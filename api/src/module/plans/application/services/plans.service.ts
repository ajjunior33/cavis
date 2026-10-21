import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlansRepository } from '../../domain/repositories/plans.repository';
import { CreatePlanDayDTO } from '../../presentation/http/controllers/schemas/create-plan-day.schema';
import { CreatePlanDTO } from '../../presentation/http/controllers/schemas/create-plan.schema';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  public async list() {
    return this.plansRepository.getAll();
  }

  public async findById(id: string) {
    const plan = await this.plansRepository.findById(id);

    if (!plan) {
      throw new NotFoundException('O plano informado não foi encontrado.');
    }

    return plan;
  }

  public async findBySlug(slug: string) {
    const plan = await this.plansRepository.findBySlug(slug);

    if (!plan) {
      throw new NotFoundException('O plano informado não foi encontrado.');
    }

    const days = await this.plansRepository.getDaysByPlanId(plan.id);

    return { ...plan, days };
  }

  public async getDays(planId: string) {
    return this.plansRepository.getDaysByPlanId(planId);
  }

  public async findDayById(id: string) {
    return this.plansRepository.findDayById(id);
  }

  public async create(data: CreatePlanDTO) {
    const days = data.days ?? [];

    this.assertDaysWithinTotal(days, data.total_days);

    const dayNumbers = days.map((day) => day.day_number);
    if (new Set(dayNumbers).size !== dayNumbers.length) {
      throw new BadRequestException(
        "Existem 'day_number' repetidos nos dias informados.",
      );
    }

    const existing = await this.plansRepository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictException('Já existe um plano com esse slug.');
    }

    const plan = await this.plansRepository.create(
      {
        slug: data.slug,
        title: data.title,
        description: data.description,
        totalDays: data.total_days,
        isDemo: data.is_demo,
      },
      days.map((day) => ({
        dayNumber: day.day_number,
        title: day.title,
        content: day.content,
        practice: day.practice,
      })),
    );

    return this.findBySlug(plan.slug);
  }

  public async createDay(planId: string, data: CreatePlanDayDTO) {
    const plan = await this.findById(planId);

    this.assertDaysWithinTotal([data], plan.totalDays);

    const existing = await this.plansRepository.findDayByNumber(
      planId,
      data.day_number,
    );
    if (existing) {
      throw new ConflictException(
        'Já existe um dia com esse número neste plano.',
      );
    }

    return this.plansRepository.createDay({
      planId,
      dayNumber: data.day_number,
      title: data.title,
      content: data.content,
      practice: data.practice,
    });
  }

  private assertDaysWithinTotal(days: CreatePlanDayDTO[], totalDays: number) {
    if (days.some((day) => day.day_number > totalDays)) {
      throw new BadRequestException(
        "O 'day_number' não pode ser maior que 'total_days' do plano.",
      );
    }
  }
}
