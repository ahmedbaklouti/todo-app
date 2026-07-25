import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getRefreshTokenFromRequest(request: Request) {
    const cookies = request.cookies as
      Record<string, string | undefined> | undefined;
    return cookies?.[this.authService.getRefreshCookieName()];
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);

    response.cookie(
      this.authService.getRefreshCookieName(),
      session.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    response.cookie(
      this.authService.getRefreshCookieName(),
      session.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(request);
    const session = await this.authService.refresh(refreshToken);

    if (session.refreshToken !== refreshToken) {
      response.cookie(
        this.authService.getRefreshCookieName(),
        session.refreshToken,
        this.authService.getRefreshCookieOptions(),
      );
    }

    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(request);
    const result = await this.authService.logout(refreshToken);

    response.clearCookie(
      this.authService.getRefreshCookieName(),
      this.authService.getRefreshCookieClearOptions(),
    );

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }
}
