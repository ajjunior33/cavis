import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlansService } from '../../../plans/application/services/plans.service';
import { UserPlansRepository } from '../../domain/repositories/user-plans.repository';

@Injectable()
export class UserPlansService {
  constructor(
    private readonly userPlansRepository: UserPlansRepository,
    private readonly plansService: PlansService,
  ) {}

  public async list(userId: string) {
    return this.userPlansRepository.getAllByUserId(userId);
  }

  public async findById(userId: string, id: string) {
    const userPlan = await this.getOwnedUserPlan(userId, id);

    const [plan, days, completions] = await Promise.all([
      this.plansService.findById(userPlan.planId),
      this.plansService.getDays(userPlan.planId),
      this.userPlansRepository.getCompletions(userPlan.id),
    ]);

    const completedAtByDay = new Map(
      completions.map((item) => [item.planDayId, item.completedAt]),
    );

    return {
      ...userPlan,
      plan,
      completedDays: completions.length,
      days: days.map((day) => ({
        ...day,
        completedAt: completedAtByDay.get(day.id) ?? null,
      })),
    };
  }

  public async enroll(userId: string, planId: string) {
    await this.plansService.findById(planId);

    const existing = await this.userPlansRepository.findByUserIdAndPlanId(
      userId,
      planId,
    );
    if (existing) {
      throw new ConflictException('Você já está inscrito neste plano.');
    }

    return this.userPlansRepository.create({ userId, planId });
  }

  public async completeDay(userId: string, id: string, planDayId: string) {
    const userPlan = await this.getOwnedUserPlan(userId, id);

    const day = await this.plansService.findDayById(planDayId);
    if (!day) {
      throw new NotFoundException('O dia informado não foi encontrado.');
    }
    if (day.planId !== userPlan.planId) {
      throw new BadRequestException(
        'O dia informado não pertence a este plano.',
      );
    }

    const plan = await this.plansService.findById(userPlan.planId);

    const progress = await this.userPlansRepository.completeDay(
      userPlan.id,
      day.id,
      plan.totalDays,
    );

    return { ...progress, totalDays: plan.totalDays };
  }

  private async getOwnedUserPlan(userId: string, id: string) {
    const userPlan = await this.userPlansRepository.findByIdAndUserId(
      id,
      userId,
    );

    if (!userPlan) {
      throw new NotFoundException('A inscrição informada não foi encontrada.');
    }

    return userPlan;
  }
}
