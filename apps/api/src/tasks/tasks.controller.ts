import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Query('listId') listId: string) {
    return this.tasksService.findAll(listId);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create('demo-user', dto);
  }

  @Patch(':id/complete')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus('demo-user', id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove('demo-user', id);
  }
}
