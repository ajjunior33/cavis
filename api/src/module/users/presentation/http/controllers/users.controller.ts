import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../../../shared/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { UsersService } from '../../../application/services/users.service';
import {
  createUserSchema,
  type CreateUserDTO,
} from '../schemas/create-user.schema';

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
}
