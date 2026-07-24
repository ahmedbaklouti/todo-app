import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateListDto } from './dto/create-list.dto';
import { ListsRepository } from './repositories/lists.repository';

@Injectable()
export class ListsService {
  constructor(private readonly listsRepository: ListsRepository) {}

  findAll(userId: string) {
    return this.listsRepository.findByUserId(userId);
  }

  async create(userId: string, dto: CreateListDto) {
    try {
      return await this.listsRepository.create(userId, dto.name.trim());
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A list with this name already exists');
      }

      throw error;
    }
  }

  async remove(userId: string, id: string) {
    const existingList = await this.listsRepository.findByIdAndUserId(id, userId);

    if (!existingList) {
      throw new NotFoundException('List not found');
    }

    return this.listsRepository.delete(id);
  }
}
