import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../../../shared/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { AuthService } from '../../../application/services/auth.service';
import { type SignInDTO, signInSchema } from '../schema/sign-in.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/')
  public async signIn(
    @Body(new ZodValidationPipe(signInSchema)) body: SignInDTO,
  ) {
    return this.authService.signIn(body);
  }
}
