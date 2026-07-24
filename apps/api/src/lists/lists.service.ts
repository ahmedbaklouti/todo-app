import { Injectable } from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { ListsRepository } from './repositories/lists.repository';

@Injectable()
export class ListsService {
  constructor(private readonly listsRepository: ListsRepository) {}

  findAll(userId: string) {
    return this.listsRepository.findByUserId(userId);
  }

  create(userId: string, dto: CreateListDto) {
    return {
      message: 'Create list flow scaffolded',
      userId,
      dto,
    };
  }

  remove(userId: string, id: string) {
    return {
      message: 'Delete list flow scaffolded',
      userId,
      id,
    };
  }
}
