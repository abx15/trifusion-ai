import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeGateway } from './realtime.gateway';
import { AuthModule } from '../auth/auth.module';
import { PolicyModule } from '../../common/policy/policy.module';

@Module({
  imports: [AuthModule, PolicyModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
