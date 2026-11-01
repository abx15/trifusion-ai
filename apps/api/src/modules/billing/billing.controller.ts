import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  checkout(@Body() body: { priceId: string; successUrl: string; cancelUrl: string }, @Headers('x-workspace-id') workspaceId: string) {
    return this.billing.createCheckout(workspaceId, body.priceId, body.successUrl, body.cancelUrl);
  }

  @Post('portal')
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  portal(@Body() body: { customerId: string; returnUrl: string }) {
    return this.billing.createPortal(body.customerId, body.returnUrl);
  }
}

@Controller('billing/webhooks')
export class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post('stripe')
  stripe(
    @Headers('stripe-signature') signature: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request & { rawBody?: Buffer },
  ) {
    const event = this.billing.constructWebhook(request.rawBody || JSON.stringify(body), signature);
    return { received: true, type: event.type };
  }
}
