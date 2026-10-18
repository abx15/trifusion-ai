import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, PolicyModule, AuditModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
