import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;

  constructor(config: ConfigService) {
    const secret = config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET');
    this.stripe = secret && !secret.includes('your-') ? new Stripe(secret) : null;
  }

  private requireStripe() {
    if (!this.stripe) throw new ServiceUnavailableException('Billing provider is not configured');
    return this.stripe;
  }

  async createCheckout(workspaceId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const stripe = this.requireStripe();
    return stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { workspaceId },
    });
  }

  async createPortal(customerId: string, returnUrl: string) {
    return this.requireStripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  }

  constructWebhook(payload: string | Buffer, signature: string) {
    if (!this.webhookSecret) throw new ServiceUnavailableException('Billing webhook is not configured');
    return this.requireStripe().webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
