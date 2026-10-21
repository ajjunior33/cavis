import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../../../shared/decorators/public.decorator';
import { AuthTokenService } from '../../../application/services/auth-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authTokenService: AuthTokenService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.headers.authorization as string | undefined;

    if (!accessToken) throw new UnauthorizedException();

    const token = accessToken.replace('Bearer', '').trim();

    try {
      const payload = this.authTokenService.verifyAccessToken(token as string);
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
