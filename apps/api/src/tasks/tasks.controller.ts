import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { TaskIdParamDto } from './dto/task-id-param.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindTasksQueryDto) {
    return this.tasksService.findAll(user.id, query.listId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, params.id, dto);
  }

  @Patch(':id/complete')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(user.id, params.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param() params: TaskIdParamDto) {
    return this.tasksService.remove(user.id, params.id);
  }
}
