import { Injectable } from '@nestjs/common';
import { CheckInsService } from '../../../check-ins/application/services/check-ins.service';
import { UserPlansService } from '../../../user-plans/application/services/user-plans.service';

@Injectable()
export class JourneyService {
  constructor(
    private readonly checkInsService: CheckInsService,
    private readonly userPlansService: UserPlansService,
  ) {}

  public async getJourney(userId: string, checkInsLimit: number) {
    const [recentCheckIns, userPlans] = await Promise.all([
      this.checkInsService.list(userId, checkInsLimit),
      this.userPlansService.list(userId),
    ]);

    const plans = userPlans.map((userPlan) => {
      const totalDays = userPlan.plan.totalDays;

      return {
        id: userPlan.id,
        startedAt: userPlan.startedAt,
        completedAt: userPlan.completedAt,
        plan: {
          id: userPlan.plan.id,
          slug: userPlan.plan.slug,
          title: userPlan.plan.title,
        },
        totalDays,
        completedDays: userPlan.completedDays,
        percent: Math.round((userPlan.completedDays / totalDays) * 100),
      };
    });

    return { recentCheckIns, plans };
  }
}
