import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksRepository } from './repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  findAll(listId: string) {
    return this.tasksRepository.findByListId(listId);
  }

  create(userId: string, dto: CreateTaskDto) {
    return {
      message: 'Create task flow scaffolded',
      userId,
      dto,
    };
  }

  updateStatus(userId: string, id: string, dto: UpdateTaskStatusDto) {
    return {
      message: 'Update task status flow scaffolded',
      userId,
      id,
      dto,
    };
  }

  remove(userId: string, id: string) {
    return {
      message: 'Delete task flow scaffolded',
      userId,
      id,
    };
  }
}
