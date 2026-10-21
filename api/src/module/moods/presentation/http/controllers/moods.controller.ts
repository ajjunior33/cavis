import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { MoodsService } from '../../../application/services/moods.service';
import {
  createMoodSchema,
  type CreateMoodDTO,
} from './schemas/create-mood.schema';

@Controller('moods')
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Get('/')
  public async list() {
    return this.moodsService.list();
  }

  @UseGuards(AdminGuard)
  @Post('/')
  public async create(
    @Body(new ZodValidationPipe(createMoodSchema)) body: CreateMoodDTO,
  ) {
    return this.moodsService.create(body);
  }
}
