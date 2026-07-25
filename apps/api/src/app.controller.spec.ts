import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return the API status payload', () => {
      jest.spyOn(appService, 'getStatus').mockReturnValue({
        name: 'todo-app-api',
        status: 'ok',
        timestamp: '2026-07-25T00:00:00.000Z',
      });

      expect(appController.getStatus()).toEqual({
        name: 'todo-app-api',
        status: 'ok',
        timestamp: '2026-07-25T00:00:00.000Z',
      });
    });
  });
});
