import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TodayService } from '../../../application/services/today.service';

@Controller('today')
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  @Get('/')
  public async getToday(@Req() request: Request) {
    return this.todayService.getToday(request.user!.id);
  }
}
