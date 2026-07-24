import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  register(payload: RegisterDto) {
    return {
      message: 'Register flow scaffolded',
      payload,
    };
  }

  login(payload: LoginDto) {
    return {
      message: 'Login flow scaffolded',
      payload,
    };
  }

  refresh() {
    return {
      message: 'Refresh flow scaffolded',
    };
  }

  logout() {
    return {
      message: 'Logout flow scaffolded',
    };
  }
}
