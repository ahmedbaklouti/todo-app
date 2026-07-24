import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByListId(listId: string) {
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
