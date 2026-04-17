import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RbacModule } from '../rbac/rbac.module';
import { R2StorageService } from '../common/storage/spaces-storage.service';

@Module({
  imports: [RbacModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, R2StorageService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
