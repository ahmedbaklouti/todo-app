import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @HttpCode(200)
  @Post('refresh')
  refresh() {
    return this.authService.refresh();
  }

  @HttpCode(200)
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  me() {
    return {
      message: 'Current user endpoint scaffolded',
    };
  }
}
