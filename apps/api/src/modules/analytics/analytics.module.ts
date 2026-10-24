import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController, PlatformAnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule, PolicyModule],
  controllers: [AnalyticsController, PlatformAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
