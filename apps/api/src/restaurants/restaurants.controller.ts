import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequireRestaurantPermissions } from '../rbac/decorators/require-permissions.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { RestaurantsService } from './restaurants.service';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';
import { ReplaceFloorPlanDto } from './dto/replace-floor-plan.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateRestaurantImageDto } from './dto/update-restaurant-image.dto';

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

  @Patch(':restaurantId')
  @RequireRestaurantPermissions(['restaurant:update'])
  updateRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateRestaurant(restaurantId, body);
  }

  @Patch(':restaurantId/floor-plan')
  @RequireRestaurantPermissions(['restaurant:update'])
  replaceFloorPlan(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: ReplaceFloorPlanDto,
  ) {
    return this.restaurantsService.replaceFloorPlan(restaurantId, body);
  }

  @Post(':restaurantId/images')
  @RequireRestaurantPermissions(['restaurant:update'])
  addRestaurantImage(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantImageDto,
  ) {
    return this.restaurantsService.addRestaurantImage(restaurantId, body.url);
  }

  @Delete(':restaurantId/images')
  @RequireRestaurantPermissions(['restaurant:update'])
  removeRestaurantImage(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantImageDto,
  ) {
    return this.restaurantsService.removeRestaurantImage(restaurantId, body.url);
  }

  @Post(':restaurantId/menu-items')
  @RequireRestaurantPermissions(['menu:manage'])
  createMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateMenuItemDto,
  ) {
    return this.restaurantsService.createMenuItem(restaurantId, body);
  }

  @Patch(':restaurantId/menu-items/:menuItemId')
  @RequireRestaurantPermissions(['menu:manage'])
  updateMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() body: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(restaurantId, menuItemId, body);
  }

  @Delete(':restaurantId/menu-items/:menuItemId')
  @RequireRestaurantPermissions(['menu:manage'])
  deleteMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
  ) {
    return this.restaurantsService.deleteMenuItem(restaurantId, menuItemId);
  }
}
