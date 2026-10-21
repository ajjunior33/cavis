import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../../../../shared/decorators/public.decorator';
import { UserThrottlerGuard } from '../../../../../shared/guards/user-throttler.guard';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { UsersService } from '../../../application/services/users.service';
import { toMeResponse } from '../mappers/to-me-response';
import {
  changePasswordSchema,
  type ChangePasswordDTO,
} from '../schemas/change-password.schema';
import {
  createUserSchema,
  type CreateUserDTO,
} from '../schemas/create-user.schema';
import { updateMeSchema, type UpdateMeDTO } from '../schemas/update-me.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('/')
  public async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDTO,
  ) {
    return this.usersService.create(body);
  }

  @Get('me')
  public async getMe(@Req() request: Request) {
    const user = await this.usersService.getMe(request.user!.id);
    return toMeResponse(user);
  }

  @Patch('me')
  public async updateMe(
    @Req() request: Request,
    @Body(new ZodValidationPipe(updateMeSchema)) body: UpdateMeDTO,
  ) {
    const user = await this.usersService.updateName(
      request.user!.id,
      body.name,
    );
    return toMeResponse(user);
  }

  // 5 tentativas por minuto por usuário (a guarda roda após o AuthGuard global).
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async changePassword(
    @Req() request: Request,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDTO,
  ) {
    await this.usersService.changePassword(
      request.user!.id,
      body.current_password,
      body.new_password,
    );
  }
}
