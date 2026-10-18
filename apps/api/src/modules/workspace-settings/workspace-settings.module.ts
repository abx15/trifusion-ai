import { Module } from '@nestjs/common';
import { WorkspaceSettingsController } from './workspace-settings.controller';
import { WorkspaceSettingsService } from './workspace-settings.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, PolicyModule, AuditModule],
  controllers: [WorkspaceSettingsController],
  providers: [WorkspaceSettingsService],
  exports: [WorkspaceSettingsService],
})
export class WorkspaceSettingsModule {}
