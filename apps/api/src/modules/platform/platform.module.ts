import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PlatformController],
})
export class PlatformModule {}
