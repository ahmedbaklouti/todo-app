import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  create(data: Prisma.UserCreateInput) {
    return this.usersRepository.create(data);
  }
}
