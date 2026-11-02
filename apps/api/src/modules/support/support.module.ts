import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, PolicyModule, AuthModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
