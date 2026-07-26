import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ListsRepository } from '../lists/repositories/lists.repository';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly listsRepository: ListsRepository,
    private readonly tasksGateway: TasksGateway,
  ) {}

  async findAll(userId: string, listId: string) {
    const list = await this.listsRepository.findByIdAndUserId(listId, userId);

    if (!list) {
      throw new NotFoundException('Liste introuvable.');
    }

    return this.tasksRepository.findByListIdAndUserId(listId, userId);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const list = await this.listsRepository.findByIdAndUserId(
      dto.listId,
      userId,
    );

    if (!list) {
      throw new NotFoundException('Liste introuvable.');
    }

    const task = await this.tasksRepository.create(dto);
    this.tasksGateway.emitTaskCreated(task);
    return task;
  }

  async updateStatus(userId: string, id: string, dto: UpdateTaskStatusDto) {
    const task = await this.tasksRepository.findByIdAndUserId(id, userId);

    if (!task) {
      throw new NotFoundException('Tache introuvable.');
    }

    const updatedTask = await this.tasksRepository.updateStatus(
      id,
      dto.completed,
    );
    this.tasksGateway.emitTaskCompleted(updatedTask);
    return updatedTask;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.tasksRepository.findByIdAndUserId(id, userId);

    if (!task) {
      throw new NotFoundException('Tache introuvable.');
    }

    const updatedTask = await this.tasksRepository.update(id, dto);
    this.tasksGateway.emitTaskUpdated(updatedTask);
    return updatedTask;
  }

  async remove(userId: string, id: string) {
    const task = await this.tasksRepository.findByIdAndUserId(id, userId);

    if (!task) {
      throw new NotFoundException('Tache introuvable.');
    }

    const deletedTask = await this.tasksRepository.delete(id);
    this.tasksGateway.emitTaskDeleted({
      id: deletedTask.id,
      listId: deletedTask.listId,
    });
    return deletedTask;
  }
}
