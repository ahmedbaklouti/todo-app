import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'todo-app-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
