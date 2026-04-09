import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RbacModule } from '../rbac/rbac.module';
import { SpacesStorageService } from '../common/storage/spaces-storage.service';

@Module({
  imports: [RbacModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, SpacesStorageService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
