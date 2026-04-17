import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacGuard } from './rbac.guard';
import { RbacService } from './rbac.service';

@Module({
  controllers: [RbacController],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
