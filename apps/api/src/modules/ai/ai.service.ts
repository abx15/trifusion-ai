import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';
import * as crypto from 'crypto';

@Injectable()
export class AiService {
  private readonly djangoUrl: string;
  private readonly sharedSecret: string;
  private readonly tokenTtl: number;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.djangoUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    this.sharedSecret = this.configService.get<string>('AI_SERVICE_SHARED_SECRET') || 'dev-secret';
    this.tokenTtl = this.configService.get<number>('AI_SERVICE_TOKEN_TTL_SECONDS') || 180;
    this.issuer = this.configService.get<string>('AI_SERVICE_ISSUER') || 'trifusion-ai';
    this.audience = this.configService.get<string>('AI_SERVICE_AUDIENCE') || 'ai-django';
  }

  /**
   * Create a signed service token for Django authentication
   */
  private createServiceToken(payload: {
    workspace_id: string;
    user_id: string;
    role: string;
    allowed_scopes: string[];
    request_id?: string;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const tokenPayload = {
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      nbf: now,
      exp: now + this.tokenTtl,
      jti: this.generateNonce(),
      type: 'service-token',
      ...payload,
    };
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signingInput = `${header}.${encodedPayload}`;
    const signature = this.hmacSha256(signingInput, this.sharedSecret);
    return `${signingInput}.${signature}`;
  }

  /**
   * Base64 URL-safe encoding
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64url')
      .replace(/=+$/, '');
  }

  /**
   * HMAC-SHA256 signature
   */
  private hmacSha256(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('base64url');
  }

  /**
   * Generate random nonce for replay protection
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Call Django AI service with authentication
   */
  private async callDjango<T>(
    endpoint: string,
    payload: any,
    serviceContext: {
      workspace_id: string;
      user_id: string;
      role: string;
      allowed_scopes: string[];
      request_id?: string;
    },
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new HttpException(
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const token = this.createServiceToken(serviceContext);

    try {
      const res = await fetch(`${this.djangoUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Request-Id': serviceContext.request_id || this.generateNonce(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        this.circuitBreaker.recordFailure();
        throw new HttpException(`AI service error: ${res.statusText}`, HttpStatus.BAD_GATEWAY);
      }

      const data = (await res.json()) as T;
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.circuitBreaker.recordFailure();
      throw new HttpException('Failed to call AI service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate project summary
   */
  async generateProjectSummary(data: {
    workspace_id: string;
    user_id: string;
    role: string;
    project_id: string;
    tasks: any[];
    activity: any[];
    request_id?: string;
  }) {
    return this.callDjango('/v1/ai/project-summary', data, {
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      allowed_scopes: ['project_summary'],
      request_id: data.request_id,
    });
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(data: {
    workspace_id: string;
    user_id: string;
    role: string;
    analytics: any;
    reporting_period: any;
    request_id?: string;
  }) {
    return this.callDjango('/v1/ai/weekly-report', data, {
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      allowed_scopes: ['weekly_report'],
      request_id: data.request_id,
    });
  }

  /**
   * Get task suggestions
   */
  async getTaskSuggestions(data: {
    workspace_id: string;
    user_id: string;
    role: string;
    task_id: string;
    task: any;
    project: any;
    request_id?: string;
  }) {
    return this.callDjango('/v1/ai/task-suggestions', data, {
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      allowed_scopes: ['task_suggestions'],
      request_id: data.request_id,
    });
  }

  /**
   * Ask workspace assistant
   */
  async askAssistant(data: {
    workspace_id: string;
    user_id: string;
    role: string;
    question: string;
    retrieved_context: any[];
    request_id?: string;
  }) {
    return this.callDjango('/v1/ai/assistant', data, {
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      allowed_scopes: ['workspace_assistant'],
      request_id: data.request_id,
    });
  }

  /**
   * Stream assistant response (returns URL for SSE)
   */
  async streamAssistant(data: {
    workspace_id: string;
    user_id: string;
    role: string;
    question: string;
    retrieved_context: any[];
    request_id?: string;
  }) {
    // For streaming, we return the signed token and let the frontend connect directly to NestJS
    // NestJS will then proxy the stream from Django
    const token = this.createServiceToken({
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      role: data.role,
      allowed_scopes: ['workspace_assistant'],
      request_id: data.request_id,
    });

    return {
      stream_url: `${this.djangoUrl}/v1/ai/assistant/stream`,
      token,
      request_id: data.request_id || this.generateNonce(),
    };
  }
}
