import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../users/application/services/users.service';
import { SignInDTO } from '../../presentation/http/schema/sign-in.schema';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  public async signIn({ email, password }: SignInDTO) {
    const validateUser = await this.usersService.validatePassword(
      email,
      password,
    );

    if (!validateUser) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const user = await this.usersService.findEmail(email)!;

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const access_token = await this.authTokenService.signInAccessToken(
      user.id,
      user.role,
    );

    return { user, access_token };
  }
}
