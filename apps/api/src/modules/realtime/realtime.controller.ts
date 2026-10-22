import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  @Get('stream')
  stream(@CurrentUser() user: any, @Query('workspaceId') workspaceId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'connected', userId: user.id, workspaceId })}\n\n`);
    const interval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', ts: Date.now() })}\n\n`);
    }, 15000);
    res.on('close', () => clearInterval(interval));
  }
}
