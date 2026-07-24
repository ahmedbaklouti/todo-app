import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { ListsRepository } from './repositories/lists.repository';

@Module({
  controllers: [ListsController],
  providers: [ListsService, ListsRepository],
  exports: [ListsService],
})
export class ListsModule {}
