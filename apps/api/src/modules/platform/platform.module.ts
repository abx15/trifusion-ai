import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { FeatureFlagService } from './feature-flag.service';
import { EntitlementService } from './entitlement.service';
import { PrivilegedAccessGrantService } from './privileged-access.service';
import { PlatformHealthService } from './platform-health.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PlatformController],
  providers: [
    FeatureFlagService,
    EntitlementService,
    PrivilegedAccessGrantService,
    PlatformHealthService,
  ],
  exports: [
    FeatureFlagService,
    EntitlementService,
    PrivilegedAccessGrantService,
    PlatformHealthService,
  ],
})
export class PlatformModule {}
