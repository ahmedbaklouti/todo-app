import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByListIdAndUserId(listId: string, userId: string) {
    return this.prisma.task.findMany({
      where: {
        listId,
        list: {
          userId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findByIdAndUserId(id: string, userId: string) {
    return this.prisma.task.findFirst({
      where: {
        id,
        list: {
          userId,
        },
      },
    });
  }

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        listId: dto.listId,
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription ? dto.longDescription : null,
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  updateStatus(id: string, completed: boolean) {
    return this.prisma.task.update({
      where: { id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.shortDescription !== undefined
          ? { shortDescription: dto.shortDescription }
          : {}),
        ...(dto.longDescription !== undefined
          ? { longDescription: dto.longDescription || null }
          : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: new Date(dto.dueDate) }
          : {}),
      },
    });
  }

  delete(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
