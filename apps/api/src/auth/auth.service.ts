import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthUser } from './interfaces/auth-user.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(payload: RegisterDto) {
    this.validateRegisterPayload(payload);
    const normalizedEmail = payload.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException(
        'Un compte existe deja pour cette adresse email',
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    let user;

    try {
      user = await this.usersService.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: normalizedEmail,
        passwordHash,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un compte existe deja pour cette adresse email',
        );
      }

      throw error;
    }

    return this.createSession(user.id);
  }

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(
      payload.email.toLowerCase().trim(),
    );

    if (!user) {
      throw new UnauthorizedException(
        'Adresse email ou mot de passe incorrect.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Adresse email ou mot de passe incorrect.',
      );
    }

    return this.createSession(user.id);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Le token de session est manquant.');
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const storedToken =
      await this.refreshTokensRepository.findByTokenHash(refreshTokenHash);

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Le token de session est invalide ou expire.',
      );
    }

    return this.createAccessSession(storedToken.userId, refreshToken);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const refreshTokenHash = this.hashToken(refreshToken);
      const storedToken =
        await this.refreshTokensRepository.findByTokenHash(refreshTokenHash);

      if (storedToken) {
        await this.refreshTokensRepository.revokeById(storedToken.id);
      }
    }

    return {
      success: true,
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return this.toAuthUser(user);
  }

  getRefreshCookieName() {
    return (
      this.configService.get<string>('REFRESH_COOKIE_NAME') ?? 'refresh_token'
    );
  }

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure:
        this.configService.get<string>('REFRESH_COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(Date.now() + this.getRefreshTokenTtlMs()),
    };
  }

  getRefreshCookieClearOptions() {
    return {
      httpOnly: true,
      secure:
        this.configService.get<string>('REFRESH_COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private async createSession(userId: string) {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlMs(),
    );

    await this.refreshTokensRepository.create(
      userId,
      refreshTokenHash,
      refreshTokenExpiresAt,
    );

    return this.createAccessSession(userId, refreshToken);
  }

  private async createAccessSession(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
    });

    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      secret: this.getRequiredConfig('JWT_ACCESS_SECRET'),
      expiresIn: this.getAccessTokenTtlSeconds(),
    });
  }

  private validateRegisterPayload(payload: RegisterDto) {
    if (
      payload.email.toLowerCase().trim() !==
      payload.emailConfirmation.toLowerCase().trim()
    ) {
      throw new BadRequestException(
        "La confirmation de l'adresse email ne correspond pas.",
      );
    }

    if (payload.password !== payload.passwordConfirmation) {
      throw new BadRequestException(
        'La confirmation du mot de passe ne correspond pas.',
      );
    }
  }

  private toAuthUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }): AuthUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }

  private generateRefreshToken() {
    return randomBytes(48).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`La variable ${key} n'est pas configuree`);
    }

    return value;
  }

  private getRefreshTokenTtlMs() {
    const refreshTokenTtl =
      this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d';
    return this.parseDurationToMs(refreshTokenTtl);
  }

  private getAccessTokenTtlSeconds() {
    const accessTokenTtl =
      this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m';
    return Math.floor(this.parseDurationToMs(accessTokenTtl) / 1000);
  }

  private parseDurationToMs(duration: string) {
    if (duration.endsWith('d')) {
      const days = Number.parseInt(duration.slice(0, -1), 10);
      return days * 24 * 60 * 60 * 1000;
    }

    if (duration.endsWith('h')) {
      const hours = Number.parseInt(duration.slice(0, -1), 10);
      return hours * 60 * 60 * 1000;
    }

    if (duration.endsWith('m')) {
      const minutes = Number.parseInt(duration.slice(0, -1), 10);
      return minutes * 60 * 1000;
    }

    return Number.parseInt(duration, 10);
  }
}
