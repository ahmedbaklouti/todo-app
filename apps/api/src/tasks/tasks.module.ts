import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListsModule } from '../lists/lists.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksGateway } from './tasks.gateway';

@Module({
  imports: [AuthModule, ListsModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TasksGateway],
  exports: [TasksService],
})
export class TasksModule {}
