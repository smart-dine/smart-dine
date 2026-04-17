import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { KioskGateway } from './kiosk.gateway';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [RbacModule, OrdersModule],
  providers: [KioskGateway],
  exports: [KioskGateway],
})
export class RealtimeModule {}
