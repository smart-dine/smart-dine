import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';

@Controller({
  path: 'restaurants',
  version: '1',
})
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @AllowAnonymous()
  findAll(@Query() query: ListRestaurantsDto) {
    return this.restaurantsService.findAll(query);
  }

  @Get(':restaurantId')
  @AllowAnonymous()
  findOne(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findOne(restaurantId);
  }

  @Get(':restaurantId/menu-items')
  @AllowAnonymous()
  findMenuItems(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findMenuItems(restaurantId);
  }

  @Get(':restaurantId/floor-map')
  @AllowAnonymous()
  findFloorMap(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findFloorMap(restaurantId);
  }
}
