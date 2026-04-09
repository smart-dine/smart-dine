import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RbacModule } from '../rbac/rbac.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RbacModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
