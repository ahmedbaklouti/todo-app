import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ListsRepository } from '../lists/repositories/lists.repository';
import { TasksRepository } from './repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
  ) {}

  async findAll(userId: string, listId: string) {
    const list = await this.listsRepository.findByIdAndUserId(listId, userId);

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return this.tasksRepository.findByListIdAndUserId(listId, userId);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const list = await this.listsRepository.findByIdAndUserId(dto.listId, userId);

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return this.tasksRepository.create(dto);
  }

  async updateStatus(userId: string, id: string, dto: UpdateTaskStatusDto) {
    const task = await this.tasksRepository.findByIdAndUserId(id, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.tasksRepository.updateStatus(id, dto.completed);
  }

  async remove(userId: string, id: string) {
    const task = await this.tasksRepository.findByIdAndUserId(id, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.tasksRepository.delete(id);
  }
}
