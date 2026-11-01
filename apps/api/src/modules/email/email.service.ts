import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('SENDGRID_FROM_EMAIL') || config.get<string>('EMAIL_FROM', '');
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASSWORD');
    const sendgridKey = config.get<string>('SENDGRID_API_KEY');
    const secure = config.get<string>('SMTP_SECURE') === 'true';
    const port = Number(config.get<string>('SMTP_PORT') || '587');
    this.transporter = host && user && pass
      ? nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        })
      : sendgridKey && !sendgridKey.includes('your-')
        ? nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: { user: 'apikey', pass: sendgridKey },
          })
      : null;
  }

  isConfigured() {
    return Boolean(this.transporter && this.from);
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter || !this.from) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }
    return this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
