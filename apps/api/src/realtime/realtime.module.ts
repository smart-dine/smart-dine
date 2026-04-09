import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { KioskGateway } from './kiosk.gateway';

@Module({
	imports: [RbacModule],
	providers: [KioskGateway],
	exports: [KioskGateway],
})
export class RealtimeModule {}
