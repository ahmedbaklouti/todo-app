import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ListsRepository } from '../lists/repositories/lists.repository';
import { TasksGateway } from './tasks.gateway';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let tasksService: TasksService;
  let tasksRepository: {
    findByListIdAndUserId: jest.Mock;
    findByIdAndUserId: jest.Mock;
    create: jest.Mock;
    updateStatus: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let listsRepository: {
    findByIdAndUserId: jest.Mock;
  };
  let tasksGateway: {
    emitTaskCreated: jest.Mock;
    emitTaskCompleted: jest.Mock;
    emitTaskUpdated: jest.Mock;
    emitTaskDeleted: jest.Mock;
  };

  beforeEach(async () => {
    tasksRepository = {
      findByListIdAndUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    listsRepository = {
      findByIdAndUserId: jest.fn(),
    };

    tasksGateway = {
      emitTaskCreated: jest.fn(),
      emitTaskCompleted: jest.fn(),
      emitTaskUpdated: jest.fn(),
      emitTaskDeleted: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: tasksRepository },
        { provide: ListsRepository, useValue: listsRepository },
        { provide: TasksGateway, useValue: tasksGateway },
      ],
    }).compile();

    tasksService = moduleRef.get(TasksService);
  });

  it('creates a task for an owned list and emits task:created', async () => {
    const createdTask = {
      id: 'task-1',
      listId: 'list-1',
      shortDescription: 'Prepare demo',
      longDescription: null,
      dueDate: '2026-07-31T00:00:00.000Z',
      completed: false,
      createdAt: '2026-07-25T10:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    };

    listsRepository.findByIdAndUserId.mockResolvedValue({ id: 'list-1' });
    tasksRepository.create.mockResolvedValue(createdTask);

    const result = await tasksService.create('user-1', {
      listId: 'list-1',
      shortDescription: 'Prepare demo',
      longDescription: undefined,
      dueDate: '2026-07-31',
    });

    expect(result).toEqual(createdTask);
    expect(tasksGateway.emitTaskCreated).toHaveBeenCalledWith(createdTask);
  });

  it('rejects task creation when the list does not belong to the user', async () => {
    listsRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      tasksService.create('user-1', {
        listId: 'list-1',
        shortDescription: 'Prepare demo',
        longDescription: undefined,
        dueDate: '2026-07-31',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates task status and emits task:completed', async () => {
    const updatedTask = {
      id: 'task-1',
      listId: 'list-1',
      shortDescription: 'Prepare demo',
      longDescription: null,
      dueDate: '2026-07-31T00:00:00.000Z',
      completed: true,
      completedAt: '2026-07-25T11:00:00.000Z',
      createdAt: '2026-07-25T10:00:00.000Z',
      updatedAt: '2026-07-25T11:00:00.000Z',
    };

    tasksRepository.findByIdAndUserId.mockResolvedValue({
      id: 'task-1',
      listId: 'list-1',
    });
    tasksRepository.updateStatus.mockResolvedValue(updatedTask);

    const result = await tasksService.updateStatus('user-1', 'task-1', {
      completed: true,
    });

    expect(result).toEqual(updatedTask);
    expect(tasksGateway.emitTaskCompleted).toHaveBeenCalledWith(updatedTask);
  });

  it('updates a task and emits task:updated', async () => {
    const updatedTask = {
      id: 'task-1',
      listId: 'list-1',
      shortDescription: 'Prepare final demo',
      longDescription: 'Detailed note',
      dueDate: '2026-08-01T00:00:00.000Z',
      completed: false,
      createdAt: '2026-07-25T10:00:00.000Z',
      updatedAt: '2026-07-25T12:00:00.000Z',
    };

    tasksRepository.findByIdAndUserId.mockResolvedValue({
      id: 'task-1',
      listId: 'list-1',
    });
    tasksRepository.update.mockResolvedValue(updatedTask);

    const result = await tasksService.update('user-1', 'task-1', {
      shortDescription: 'Prepare final demo',
      longDescription: 'Detailed note',
      dueDate: '2026-08-01',
    });

    expect(result).toEqual(updatedTask);
    expect(tasksGateway.emitTaskUpdated).toHaveBeenCalledWith(updatedTask);
  });

  it('deletes a task and emits task:deleted', async () => {
    tasksRepository.findByIdAndUserId.mockResolvedValue({
      id: 'task-1',
      listId: 'list-1',
    });
    tasksRepository.delete.mockResolvedValue({
      id: 'task-1',
      listId: 'list-1',
    });

    const result = await tasksService.remove('user-1', 'task-1');

    expect(result).toEqual({ id: 'task-1', listId: 'list-1' });
    expect(tasksGateway.emitTaskDeleted).toHaveBeenCalledWith({
      id: 'task-1',
      listId: 'list-1',
    });
  });
});
