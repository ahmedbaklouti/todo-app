import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RefreshTokensRepository],
  exports: [AuthService],
})
export class AuthModule {}
