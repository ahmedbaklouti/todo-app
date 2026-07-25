import { execFileSync } from 'child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import path from 'path';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { URL } from 'url';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthSessionResponse = {
  accessToken: string;
};

type CreatedEntityResponse = {
  id: string;
};

type TaskRealtimePayload = {
  id: string;
  listId: string;
  shortDescription: string;
  completed: boolean;
};

type TaskDeletedPayload = {
  id: string;
  listId: string;
};

type JoinListPayload = {
  listId: string;
};

type JoinListResponse = {
  joined: string;
};

interface TestServerToClientEvents {
  'task:created': (payload: TaskRealtimePayload) => void;
  'task:completed': (payload: TaskRealtimePayload) => void;
  'task:deleted': (payload: TaskDeletedPayload) => void;
}

interface TestClientToServerEvents {
  'list:join': (
    payload: JoinListPayload,
    ack: (response: JoinListResponse) => void,
  ) => void;
}

type TestSocket = Socket<TestServerToClientEvents, TestClientToServerEvents>;
type ServerEventName = keyof TestServerToClientEvents;
type ServerEventPayloadMap = {
  'task:created': TaskRealtimePayload;
  'task:completed': TaskRealtimePayload;
  'task:deleted': TaskDeletedPayload;
};

function buildE2EDatabaseUrl() {
  const baseUrl =
    process.env.DATABASE_URL ??
    'postgresql://todo_user:todo_password@127.0.0.1:5432/todo_app?schema=public';
  const databaseUrl = new URL(baseUrl.replace('@postgres:', '@127.0.0.1:'));
  const schema = `e2e_${randomUUID().replace(/-/g, '')}`;

  if (databaseUrl.hostname === 'postgres') {
    databaseUrl.hostname = '127.0.0.1';
  }

  databaseUrl.searchParams.set('schema', schema);

  return {
    databaseUrl: databaseUrl.toString(),
    schema,
  };
}

function runPrismaDbPush(databaseUrl: string) {
  const prismaCliPath = path.join(
    path.dirname(require.resolve('prisma/package.json')),
    'build',
    'index.js',
  );

  execFileSync(
    process.execPath,
    [prismaCliPath, 'db', 'push', '--skip-generate'],
    {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    },
  );
}

function waitForSocketConnect(socket: TestSocket) {
  return new Promise<void>((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      reject(new Error('Timed out waiting for socket connection'));
    }, 5000);

    const handleConnect = () => {
      clearTimeout(timeout);
      socket.off('connect_error', handleConnectError);
      resolve();
    };

    const handleConnectError = (error: Error) => {
      clearTimeout(timeout);
      socket.off('connect', handleConnect);
      reject(error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
  });
}

function onceSocketEvent(
  socket: TestSocket,
  eventName: 'task:created',
): Promise<TaskRealtimePayload>;
function onceSocketEvent(
  socket: TestSocket,
  eventName: 'task:completed',
): Promise<TaskRealtimePayload>;
function onceSocketEvent(
  socket: TestSocket,
  eventName: 'task:deleted',
): Promise<TaskDeletedPayload>;
function onceSocketEvent(socket: TestSocket, eventName: ServerEventName) {
  return new Promise<ServerEventPayloadMap[ServerEventName]>(
    (resolve, reject) => {
      const handleSuccess = (
        payload: ServerEventPayloadMap[ServerEventName],
      ) => {
        clearTimeout(timeout);
        socket.off(eventName, handleSuccess);
        resolve(payload);
      };

      const timeout = setTimeout(() => {
        socket.off(eventName, handleSuccess);
        reject(new Error(`Timed out waiting for socket event: ${eventName}`));
      }, 5000);

      socket.on(eventName, handleSuccess);
    },
  );
}

describe('Todo App flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let schema: string;
  let activeSocket: TestSocket | null = null;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
    process.env.JWT_ACCESS_TTL ??= '15m';
    process.env.JWT_REFRESH_TTL ??= '7d';
    process.env.REFRESH_COOKIE_NAME ??= 'refresh_token';
    process.env.REFRESH_COOKIE_SECURE ??= 'false';

    const testDatabase = buildE2EDatabaseUrl();
    process.env.DATABASE_URL = testDatabase.databaseUrl;
    schema = testDatabase.schema;

    runPrismaDbPush(testDatabase.databaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    await app.listen(0, '127.0.0.1');

    prisma = app.get(PrismaService);
    await prisma.refreshToken.deleteMany();
    await prisma.task.deleteMany();
    await prisma.taskList.deleteMany();
    await prisma.user.deleteMany();
  });

  it('covers registration, token refresh, list creation, task creation, websocket propagation and task deletion', async () => {
    const httpServer = app.getHttpServer() as Parameters<
      typeof request.agent
    >[0];
    const httpClient = request.agent(httpServer);

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
    const refreshBody = refreshResponse.body as AuthSessionResponse;
    const accessToken = refreshBody.accessToken;

    const listResponse = await httpClient
      .post('/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Recrutement',
      })
      .expect(201);

    const listBody = listResponse.body as CreatedEntityResponse;
    const createdListId = listBody.id;

    activeSocket = io(await app.getUrl(), {
      auth: {
        token: accessToken,
      },
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      withCredentials: true,
    });

    await waitForSocketConnect(activeSocket);

    await expect(
      activeSocket.emitWithAck('list:join', { listId: createdListId }),
    ).resolves.toEqual<JoinListResponse>({ joined: createdListId });

    const taskCreatedEventPromise = onceSocketEvent(
      activeSocket,
      'task:created',
    );

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

    const taskBody = taskResponse.body as CreatedEntityResponse;
    const createdTaskId = taskBody.id;

    await expect(taskCreatedEventPromise).resolves.toMatchObject({
      id: createdTaskId,
      listId: createdListId,
      shortDescription: 'Contacter le candidat',
      completed: false,
    });

    const taskCompletedEventPromise = onceSocketEvent(
      activeSocket,
      'task:completed',
    );

    await httpClient
      .patch(`/tasks/${createdTaskId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        completed: true,
      })
      .expect(200);

    await expect(taskCompletedEventPromise).resolves.toMatchObject({
      id: createdTaskId,
      listId: createdListId,
      completed: true,
    });

    const taskDeletedEventPromise = onceSocketEvent(
      activeSocket,
      'task:deleted',
    );

    await httpClient
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await expect(taskDeletedEventPromise).resolves.toEqual({
      id: createdTaskId,
      listId: createdListId,
    });

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
    activeSocket?.close();

    if (prisma) {
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
      );
    }

    await app?.close();
  });
});
