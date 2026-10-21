import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { JourneyService } from '../../../application/services/journey.service';
import {
  getJourneySchema,
  type GetJourneyDTO,
} from './schemas/get-journey.schema';

@Controller('journey')
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get('/')
  public async getJourney(
    @Req() request: Request,
    @Query(new ZodValidationPipe(getJourneySchema)) query: GetJourneyDTO,
  ) {
    return this.journeyService.getJourney(
      request.user!.id,
      query.check_ins_limit,
    );
  }
}
