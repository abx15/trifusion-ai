import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, PolicyModule, AuditModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
