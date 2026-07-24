import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('socket:connected', { id: client.id });
  }

  handleDisconnect(client: Socket) {
    return client.id;
  }

  @SubscribeMessage('list:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { listId: string },
  ) {
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
}
