import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { ListsService } from './lists.service';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  findAll() {
    return this.listsService.findAll('demo-user');
  }

  @Post()
  create(@Body() dto: CreateListDto) {
    return this.listsService.create('demo-user', dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listsService.remove('demo-user', id);
  }
}
