import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../../module/users/application/services/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user!.id;

    const user = await this.usersService.findById(userId);

    if (!user)
      throw new UnauthorizedException(
        'Houve um erro na sua autenticação. Tente logar novamente.',
      );

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    throw new ForbiddenException(
      'Você não tem permissão para acessar essa função',
    );
  }
}
