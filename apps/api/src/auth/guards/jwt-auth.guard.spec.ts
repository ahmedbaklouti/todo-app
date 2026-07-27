import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('returns the authenticated user when passport validation succeeds', () => {
    const user = { id: 'user-1' };

    expect(guard.handleRequest(null, user, undefined)).toBe(user);
  });

  it('returns a clear french error when the access token is expired', () => {
    try {
      guard.handleRequest(null, false, {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      });
      fail('The guard should reject an expired token.');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error).toMatchObject({
        response: {
          message: 'Votre session a expire. Veuillez vous reconnecter.',
        },
      });
    }
  });
});
