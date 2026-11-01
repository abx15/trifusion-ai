import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { PolicyService } from '../../common/policy/policy.service';

type AuthenticatedSocket = WebSocket & { userId?: string; workspaceId?: string };

@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly policyService: PolicyService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket, request: { url?: string }) {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      const token = url.searchParams.get('token');
      const workspaceId = url.searchParams.get('workspaceId');
      if (!token || !workspaceId) throw new Error('token and workspaceId are required');

      const payload = this.jwtService.verify<{ sub: string }>(token);
      await this.policyService.resolveUser(payload.sub);
      await this.policyService.getWorkspaceContext(payload.sub, workspaceId);

      socket.userId = payload.sub;
      socket.workspaceId = workspaceId;
      socket.send(JSON.stringify({ type: 'connected', workspaceId }));
    } catch (error) {
      this.logger.warn(`Rejected WebSocket connection: ${error instanceof Error ? error.message : 'unknown error'}`);
      socket.close(1008, 'Unauthorized');
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    socket.userId = undefined;
    socket.workspaceId = undefined;
  }

  @SubscribeMessage('ping')
  ping(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    if (!socket.userId || !socket.workspaceId) return;
    socket.send(JSON.stringify({ type: 'pong', workspaceId: socket.workspaceId, data: body ?? null }));
  }

  broadcast(workspaceId: string, event: Record<string, unknown>) {
    for (const client of this.server.clients) {
      const socket = client as AuthenticatedSocket;
      if (socket.readyState === WebSocket.OPEN && socket.workspaceId === workspaceId) {
        socket.send(JSON.stringify(event));
      }
    }
  }
}
