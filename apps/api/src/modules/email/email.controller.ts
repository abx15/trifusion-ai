import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { EmailService } from './email.service';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Get('status')
  status() {
    return { configured: this.email.isConfigured() };
  }

  @Post('send')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  send(@Body() body: { to: string; subject: string; text: string }) {
    return this.email.send(body.to, body.subject, body.text).then(() => ({ sent: true }));
  }
}
