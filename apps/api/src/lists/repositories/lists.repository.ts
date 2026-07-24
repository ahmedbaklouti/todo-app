import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.taskList.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
