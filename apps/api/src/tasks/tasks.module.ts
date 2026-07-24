import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksGateway } from './tasks.gateway';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TasksGateway],
  exports: [TasksService],
})
export class TasksModule {}
