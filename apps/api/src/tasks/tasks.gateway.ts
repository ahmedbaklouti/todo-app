import {
  ConnectedSocket,
  OnGatewayInit,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ListsRepository } from '../lists/repositories/lists.repository';
import { Server, Socket } from 'socket.io';

type TaskRealtimePayload = {
  id: string;
  listId: string;
};

type TaskDeletedPayload = {
  id: string;
  listId: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class TasksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly listsRepository: ListsRepository,
  ) {}

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const token = this.extractToken(client);

        if (!token) {
          return next(new Error('Authentication token is missing'));
        }

        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        client.data.userId = payload.sub;

        return next();
      } catch {
        return next(new Error('Authentication failed'));
      }
    });
  }

  handleConnection(client: Socket) {
    client.emit('socket:connected', { id: client.id });
  }

  handleDisconnect(client: Socket) {
    return client.id;
  }

  @SubscribeMessage('list:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { listId: string },
  ) {
    const list = await this.listsRepository.findByIdAndUserId(
      payload.listId,
      String(client.data.userId),
    );

    if (!list) {
      throw new WsException('List not found');
    }

    client.join(`list:${payload.listId}`);
    return { joined: payload.listId };
  }

  @SubscribeMessage('list:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { listId: string },
  ) {
    client.leave(`list:${payload.listId}`);
    return { left: payload.listId };
  }

  emitTaskCreated(task: TaskRealtimePayload) {
    this.server.to(`list:${task.listId}`).emit('task:created', task);
  }

  emitTaskUpdated(task: TaskRealtimePayload) {
    this.server.to(`list:${task.listId}`).emit('task:updated', task);
  }

  emitTaskDeleted(payload: TaskDeletedPayload) {
    this.server.to(`list:${payload.listId}`).emit('task:deleted', payload);
  }

  emitTaskCompleted(task: TaskRealtimePayload) {
    this.server.to(`list:${task.listId}`).emit('task:completed', task);
  }

  private extractToken(client: Socket) {
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : null;

    if (authToken) {
      return authToken;
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      return authorizationHeader.slice(7);
    }

    return null;
  }
}
