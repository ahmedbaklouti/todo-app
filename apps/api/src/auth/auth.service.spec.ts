import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  const baseUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    passwordHash:
      '$2b$10$O1B/HbGx8ZZrVSu2Ce279uV8Ec/WWEDuJeayQMZT6ZX0hgqP/d9vy',
  };

  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
  };
  let refreshTokensRepository: {
    create: jest.Mock;
    findByTokenHash: jest.Mock;
    revokeById: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    refreshTokensRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revokeById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'test-access-secret';
          case 'JWT_ACCESS_TTL':
            return '15m';
          case 'JWT_REFRESH_TTL':
            return '7d';
          case 'REFRESH_COOKIE_NAME':
            return 'refresh_token';
          case 'REFRESH_COOKIE_SECURE':
            return 'false';
          default:
            return undefined;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: RefreshTokensRepository, useValue: refreshTokensRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('registers a user and returns a session payload', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(baseUser);
    usersService.findById.mockResolvedValue(baseUser);

    const result: Awaited<ReturnType<AuthService['register']>> =
      await authService.register({
        firstName: 'John',
        lastName: 'Doe',
        email: ' JOHN@example.com ',
        emailConfirmation: 'john@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
      });

    const lastCreateCall = usersService.create.mock.lastCall as
      | [
          {
            firstName: string;
            lastName: string;
            email: string;
            passwordHash: string;
          },
        ]
      | undefined;

    expect(lastCreateCall?.[0].firstName).toBe('John');
    expect(lastCreateCall?.[0].lastName).toBe('Doe');
    expect(lastCreateCall?.[0].email).toBe('john@example.com');
    expect(lastCreateCall?.[0].passwordHash).not.toBe('Password123');
    expect(refreshTokensRepository.create).toHaveBeenCalledWith(
      baseUser.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(result.user).toEqual({
      id: baseUser.id,
      firstName: baseUser.firstName,
      lastName: baseUser.lastName,
      email: baseUser.email,
    });
    expect(result.accessToken).toBe('access-token');
    expect(typeof result.refreshToken).toBe('string');
  });

  it('rejects register payload when email confirmation does not match', async () => {
    await expect(
      authService.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailConfirmation: 'other@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects login when password is invalid', async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);

    await expect(
      authService.login({
        email: 'john@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes a session when the refresh token is valid', async () => {
    usersService.findById.mockResolvedValue(baseUser);
    refreshTokensRepository.findByTokenHash.mockResolvedValue({
      id: 'refresh-1',
      userId: baseUser.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result: Awaited<ReturnType<AuthService['refresh']>> =
      await authService.refresh('refresh-token');

    expect(refreshTokensRepository.revokeById).not.toHaveBeenCalled();
    expect(refreshTokensRepository.create).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});
