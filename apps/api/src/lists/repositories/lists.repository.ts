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

  findByIdAndUserId(id: string, userId: string) {
    return this.prisma.taskList.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  create(userId: string, name: string) {
    return this.prisma.taskList.create({
      data: {
        userId,
        name,
      },
    });
  }

  delete(id: string) {
    return this.prisma.taskList.delete({
      where: { id },
    });
  }
}
