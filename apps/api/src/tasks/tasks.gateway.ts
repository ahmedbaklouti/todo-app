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

type AuthenticatedSocketData = {
  userId?: string;
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
    server.use((client, next) => {
      void this.authenticateClient(client, next);
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
    const socketData = client.data as AuthenticatedSocketData;
    const list = await this.listsRepository.findByIdAndUserId(
      payload.listId,
      String(socketData.userId),
    );

    if (!list) {
      throw new WsException('Liste introuvable.');
    }

    void client.join(`list:${payload.listId}`);
    return { joined: payload.listId };
  }

  @SubscribeMessage('list:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { listId: string },
  ) {
    void client.leave(`list:${payload.listId}`);
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

  private async authenticateClient(
    client: Socket,
    next: (error?: Error) => void,
  ) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        next(new Error("Le token d'authentification est manquant."));
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const socketData = client.data as AuthenticatedSocketData;
      socketData.userId = payload.sub;

      next();
    } catch {
      next(new Error("L'authentification a echoue."));
    }
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

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
    ) {
      return authorizationHeader.slice(7);
    }

    return null;
  }
}
