import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  Param,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateListDto } from './dto/create-list.dto';
import { ListIdParamDto } from './dto/list-id-param.dto';
import { ListsService } from './lists.service';

@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.listsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListDto) {
    return this.listsService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param() params: ListIdParamDto) {
    return this.listsService.remove(user.id, params.id);
  }
}
