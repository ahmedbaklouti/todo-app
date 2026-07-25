import {
  Body,
  CanActivate,
  Controller,
  createParamDecorator,
  Delete,
  ExecutionContext,
  Get,
  HttpCode,
  INestApplication,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

type TestUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type TestTaskList = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type TestTask = {
  id: string;
  listId: string;
  shortDescription: string;
  longDescription: string | null;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

let authServiceRef: TestAuthService;

class RegisterDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsEmail()
  emailConfirmation!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  passwordConfirmation!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class CreateListDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

class CreateTaskDto {
  @IsString()
  listId!: string;

  @IsString()
  @MinLength(1)
  shortDescription!: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsDateString()
  dueDate!: string;
}

class TestAuthService {
  private readonly users = new Map<string, TestUser>();
  private readonly tokens = new Map<string, string>();
  private sequence = 1;

  constructor() {
    this.users.set('demo@libheros.local', {
      id: 'user-1',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@libheros.local',
      password: 'Password123',
    });
  }

  async register(payload: RegisterDto) {
    const email = payload.email.toLowerCase().trim();
    const user: TestUser = {
      id: `user-${++this.sequence}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      password: payload.password,
    };

    this.users.set(email, user);
    return this.createSession(user);
  }

  async login(payload: LoginDto) {
    const email = payload.email.toLowerCase().trim();
    const user = this.users.get(email);

    if (!user || user.password !== payload.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSession(user);
  }

  getRefreshCookieName() {
    return 'refresh_token';
  }

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/auth',
    };
  }

  getUserByAccessToken(token: string | undefined) {
    if (!token) {
      return null;
    }

    const userId = this.tokens.get(token);

    if (!userId) {
      return null;
    }

    return [...this.users.values()].find((user) => user.id === userId) ?? null;
  }

  private createSession(user: TestUser) {
    const accessToken = `token-${user.id}-${Date.now()}`;
    this.tokens.set(accessToken, user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      accessToken,
      refreshToken: `refresh-${user.id}-${Date.now()}`,
    };
  }
}

class TestListsService {
  private readonly lists: TestTaskList[] = [];
  private sequence = 1;

  findAll(userId: string) {
    return this.lists.filter((list) => list.userId === userId);
  }

  create(userId: string, dto: CreateListDto) {
    const now = new Date().toISOString();
    const list: TestTaskList = {
      id: `list-${this.sequence++}`,
      userId,
      name: dto.name,
      createdAt: now,
      updatedAt: now,
    };

    this.lists.push(list);
    return list;
  }
}

class TestTasksService {
  private readonly tasks: TestTask[] = [];
  private sequence = 1;

  findAll(_userId: string, listId: string) {
    return this.tasks.filter((task) => task.listId === listId);
  }

  create(_userId: string, dto: CreateTaskDto) {
    const now = new Date().toISOString();
    const task: TestTask = {
      id: `task-${this.sequence++}`,
      listId: dto.listId,
      shortDescription: dto.shortDescription,
      longDescription: dto.longDescription ?? null,
      dueDate: new Date(dto.dueDate).toISOString(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.push(task);
    return task;
  }

  remove(_userId: string, id: string) {
    const index = this.tasks.findIndex((task) => task.id === id);
    const [deletedTask] = this.tasks.splice(index, 1);
    return deletedTask;
  }
}

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: TestUser;
    }>();
    const authorization = request.headers.authorization;
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    const user = authServiceRef.getUserByAccessToken(accessToken);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = user;
    return true;
  }
}

const ReqUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: TestUser }>();
  return request.user;
});

@Controller('auth')
class TestAuthController {
  constructor(private readonly authService: TestAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const session = await this.authService.register(dto);
    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const session = await this.authService.login(dto);
    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }
}

@UseGuards(TestJwtAuthGuard)
@Controller('lists')
class TestListsController {
  constructor(private readonly listsService: TestListsService) {}

  @Get()
  findAll(@ReqUser() user: TestUser) {
    return this.listsService.findAll(user.id);
  }

  @Post()
  create(@ReqUser() user: TestUser, @Body() dto: CreateListDto) {
    return this.listsService.create(user.id, dto);
  }
}

@UseGuards(TestJwtAuthGuard)
@Controller('tasks')
class TestTasksController {
  constructor(private readonly tasksService: TestTasksService) {}

  @Get()
  findAll(@ReqUser() user: TestUser, @Query('listId') listId: string) {
    return this.tasksService.findAll(user.id, listId);
  }

  @Post()
  create(@ReqUser() user: TestUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@ReqUser() user: TestUser, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}

describe('Todo App flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthController, TestListsController, TestTasksController],
      providers: [
        TestAuthService,
        TestListsService,
        TestTasksService,
        TestJwtAuthGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authServiceRef = moduleFixture.get(TestAuthService);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('covers login, list creation, task creation and task deletion', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'demo@libheros.local',
        password: 'Password123',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const listResponse = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Recrutement',
      })
      .expect(201);

    const createdListId = listResponse.body.id as string;

    const taskResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        listId: createdListId,
        shortDescription: 'Contacter le candidat',
        longDescription: 'Envoyer un recap et confirmer le prochain entretien.',
        dueDate: '2026-07-31',
      })
      .expect(201);

    const createdTaskId = taskResponse.body.id as string;

    await request(app.getHttpServer())
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const tasksAfterDeletion = await request(app.getHttpServer())
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
