import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
