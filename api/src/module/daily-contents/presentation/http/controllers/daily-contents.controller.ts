import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { DailyContentsService } from '../../../application/services/daily-contents.service';
import { contentIdSchema } from './schemas/content-id.schema';
import {
  createDailyContentSchema,
  type CreateDailyContentDTO,
} from './schemas/create-daily-content.schema';
import {
  listDailyContentsSchema,
  type ListDailyContentsDTO,
} from './schemas/list-daily-contents.schema';
import {
  setContentMoodsSchema,
  type SetContentMoodsDTO,
} from './schemas/set-content-moods.schema';

@Controller('daily-contents')
export class DailyContentsController {
  constructor(private readonly dailyContentsService: DailyContentsService) {}

  @Get('/')
  public async list(
    @Query(new ZodValidationPipe(listDailyContentsSchema))
    query: ListDailyContentsDTO,
  ) {
    return this.dailyContentsService.list(query.mood_id);
  }

  @Get('/:id')
  public async findById(
    @Param('id', new ZodValidationPipe(contentIdSchema)) id: string,
  ) {
    return this.dailyContentsService.findById(id);
  }

  @UseGuards(AdminGuard)
  @Post('/')
  public async create(
    @Body(new ZodValidationPipe(createDailyContentSchema))
    body: CreateDailyContentDTO,
  ) {
    return this.dailyContentsService.create(body);
  }

  @UseGuards(AdminGuard)
  @Put('/:id/moods')
  public async setMoods(
    @Param('id', new ZodValidationPipe(contentIdSchema)) id: string,
    @Body(new ZodValidationPipe(setContentMoodsSchema))
    body: SetContentMoodsDTO,
  ) {
    return this.dailyContentsService.setMoods(id, body.mood_ids);
  }
}
