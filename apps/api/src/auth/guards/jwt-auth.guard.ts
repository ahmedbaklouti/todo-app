import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

function hasInfoProperty(
  info: unknown,
  property: 'name' | 'message',
  expectedValue: string,
) {
  const infoRecord =
    typeof info === 'object' && info !== null
      ? (info as Record<string, unknown>)
      : null;

  return (
    infoRecord !== null &&
    property in infoRecord &&
    infoRecord[property] === expectedValue
  );
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: unknown,
    user: TUser | false,
    info?: unknown,
  ): TUser {
    if (
      hasInfoProperty(info, 'name', 'TokenExpiredError') ||
      hasInfoProperty(info, 'message', 'jwt expired')
    ) {
      throw new UnauthorizedException(
        'Votre session a expire. Veuillez vous reconnecter.',
      );
    }

    if (err instanceof Error) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException('Authentification requise.');
    }

    return user;
  }
}
