import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AiGuard } from './ai.guard';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    AuditModule,
    AnalyticsModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    CircuitBreakerService,
    AiGuard,
  ],
  exports: [AiService, AiGuard],
})
export class AiModule {}
