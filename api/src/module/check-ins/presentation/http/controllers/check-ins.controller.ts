import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { CheckInsService } from '../../../application/services/check-ins.service';
import {
  createCheckInSchema,
  type CreateCheckInDTO,
} from './schemas/create-check-in.schema';

@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Get('/')
  public async list(@Req() request: Request) {
    return this.checkInsService.list(request.user!.id);
  }

  @Post('/')
  public async create(
    @Req() request: Request,
    @Body(new ZodValidationPipe(createCheckInSchema)) body: CreateCheckInDTO,
  ) {
    return this.checkInsService.create(request.user!.id, body);
  }
}
