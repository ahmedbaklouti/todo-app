import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { TasksGateway } from '../src/tasks/tasks.gateway';

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskListRecord = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  listId: string;
  shortDescription: string;
  longDescription: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};

function createPrismaMock() {
  const users: UserRecord[] = [];
  const taskLists: TaskListRecord[] = [];
  const tasks: TaskRecord[] = [];
  const refreshTokens: RefreshTokenRecord[] = [];

  return {
    $connect: jest.fn(),
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { id?: string; email?: string } }) => {
          if (where.id) {
            return users.find((user) => user.id === where.id) ?? null;
          }

          if (where.email) {
            return users.find((user) => user.email === where.email) ?? null;
          }

          return null;
        },
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;
        }) => {
          const now = new Date();
          const user: UserRecord = {
            id: randomUUID(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: data.passwordHash,
            createdAt: now,
            updatedAt: now,
          };

          users.push(user);
          return user;
        },
      ),
    },
    taskList: {
      findMany: jest.fn(({ where }: { where: { userId: string } }) =>
        taskLists
          .filter((list) => list.userId === where.userId)
          .sort(
            (left, right) =>
              left.createdAt.getTime() - right.createdAt.getTime(),
          ),
      ),
      findFirst: jest.fn(
        ({ where }: { where: { id: string; userId: string } }) =>
          taskLists.find(
            (list) => list.id === where.id && list.userId === where.userId,
          ) ?? null,
      ),
      create: jest.fn(
        ({ data }: { data: { userId: string; name: string } }) => {
          const now = new Date();
          const taskList: TaskListRecord = {
            id: randomUUID(),
            userId: data.userId,
            name: data.name,
            createdAt: now,
            updatedAt: now,
          };

          taskLists.push(taskList);
          return taskList;
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const index = taskLists.findIndex((list) => list.id === where.id);
        const [deletedList] = taskLists.splice(index, 1);

        for (let taskIndex = tasks.length - 1; taskIndex >= 0; taskIndex -= 1) {
          if (tasks[taskIndex]?.listId === where.id) {
            tasks.splice(taskIndex, 1);
          }
        }

        return deletedList;
      }),
    },
    task: {
      findMany: jest.fn(
        ({ where }: { where: { listId: string; list: { userId: string } } }) =>
          tasks
            .filter((task) => {
              const list = taskLists.find((item) => item.id === task.listId);
              return (
                task.listId === where.listId &&
                list?.userId === where.list.userId
              );
            })
            .sort(
              (left, right) =>
                left.createdAt.getTime() - right.createdAt.getTime(),
            ),
      ),
      findFirst: jest.fn(
        ({ where }: { where: { id: string; list: { userId: string } } }) =>
          tasks.find((task) => {
            const list = taskLists.find((item) => item.id === task.listId);
            return task.id === where.id && list?.userId === where.list.userId;
          }) ?? null,
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            listId: string;
            shortDescription: string;
            longDescription: string | null;
            dueDate: Date;
          };
        }) => {
          const now = new Date();
          const task: TaskRecord = {
            id: randomUUID(),
            listId: data.listId,
            shortDescription: data.shortDescription,
            longDescription: data.longDescription,
            dueDate: data.dueDate,
            completed: false,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
          };

          tasks.push(task);
          return task;
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<
            Pick<
              TaskRecord,
              | 'shortDescription'
              | 'longDescription'
              | 'dueDate'
              | 'completed'
              | 'completedAt'
            >
          >;
        }) => {
          const task = tasks.find((item) => item.id === where.id);

          if (!task) {
            return null;
          }

          Object.assign(task, data, { updatedAt: new Date() });
          return task;
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const index = tasks.findIndex((task) => task.id === where.id);
        const [deletedTask] = tasks.splice(index, 1);
        return deletedTask;
      }),
    },
    refreshToken: {
      findMany: jest.fn(({ where }: { where: { userId: string } }) =>
        refreshTokens
          .filter((token) => token.userId === where.userId)
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          ),
      ),
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: {
            tokenHash: string;
            revokedAt: null;
          };
        }) =>
          refreshTokens.find(
            (token) =>
              token.tokenHash === where.tokenHash &&
              token.revokedAt === where.revokedAt,
          ) ?? null,
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            userId: string;
            tokenHash: string;
            expiresAt: Date;
          };
        }) => {
          const refreshToken: RefreshTokenRecord = {
            id: randomUUID(),
            userId: data.userId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
            revokedAt: null,
          };

          refreshTokens.push(refreshToken);
          return refreshToken;
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { revokedAt: Date };
        }) => {
          const refreshToken = refreshTokens.find(
            (item) => item.id === where.id,
          );

          if (!refreshToken) {
            return null;
          }

          refreshToken.revokedAt = data.revokedAt;
          return refreshToken;
        },
      ),
    },
  };
}

describe('Todo App flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';
    process.env.REFRESH_COOKIE_NAME = 'refresh_token';
    process.env.REFRESH_COOKIE_SECURE = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .overrideProvider(TasksGateway)
      .useValue({
        emitTaskCreated: jest.fn(),
        emitTaskUpdated: jest.fn(),
        emitTaskDeleted: jest.fn(),
        emitTaskCompleted: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  it('covers registration, token refresh, list creation, task creation and task deletion', async () => {
    const httpClient = request.agent(app.getHttpServer());

    const registerResponse = await httpClient
      .post('/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@libheros.local',
        emailConfirmation: 'jane@libheros.local',
        password: 'Password123',
        passwordConfirmation: 'Password123',
      })
      .expect(201);

    expect(registerResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refresh_token=')]),
    );

    const refreshResponse = await httpClient.post('/auth/refresh').expect(200);
    const refreshBody = refreshResponse.body as { accessToken: string };
    const accessToken = refreshBody.accessToken;

    const listResponse = await httpClient
      .post('/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Recrutement',
      })
      .expect(201);

    const listBody = listResponse.body as { id: string };
    const createdListId = listBody.id;

    const taskResponse = await httpClient
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        listId: createdListId,
        shortDescription: 'Contacter le candidat',
        longDescription: 'Envoyer un recap et confirmer le prochain entretien.',
        dueDate: '2026-07-31',
      })
      .expect(201);

    const taskBody = taskResponse.body as { id: string };
    const createdTaskId = taskBody.id;

    await httpClient
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const tasksAfterDeletion = await httpClient
      .get('/tasks')
      .query({
        listId: createdListId,
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(tasksAfterDeletion.body).toEqual([]);
  });

  afterAll(async () => {
    await app.close();
  });
});
