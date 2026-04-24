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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequireRestaurantPermissions } from '../rbac/decorators/require-permissions.decorator';
import { CreateMenuItemCategoryDto } from './dto/create-menu-item-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { RestaurantsService } from './restaurants.service';
import { ListRestaurantsDto } from './dto/list-restaurants.dto';
import { ReplaceFloorPlanDto } from './dto/replace-floor-plan.dto';
import { SetMenuItemCategoriesDto } from './dto/set-menu-item-categories.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateRestaurantImageDto } from './dto/update-restaurant-image.dto';

@Controller({
  path: 'restaurants',
  version: '1',
})
@ApiTags('Restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List public restaurants' })
  @ApiOkResponse({
    description: 'Public restaurant list.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameter values.' })
  findAll(@Query() query: ListRestaurantsDto) {
    return this.restaurantsService.findAll(query);
  }

  @Get(':restaurantId')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get public restaurant details by id' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Restaurant details including menu items.',
    schema: {
      type: 'object',
    },
  })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  findOne(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findOne(restaurantId);
  }

  @Get(':restaurantId/menu-items')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List menu items for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Menu items for this restaurant.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  findMenuItems(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findMenuItems(restaurantId);
  }

  @Get(':restaurantId/floor-map')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get restaurant floor map and table layout' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Floor map with table coordinates and capacities.',
    schema: {
      type: 'object',
    },
  })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  findFloorMap(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.findFloorMap(restaurantId);
  }

  @Patch(':restaurantId')
  @RequireRestaurantPermissions(['restaurant:update'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Update mutable restaurant fields' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Updated restaurant record.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({
    description: 'No mutable fields were provided or payload validation failed.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing restaurant:update permission.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  updateRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateRestaurant(restaurantId, body);
  }

  @Patch(':restaurantId/floor-plan')
  @RequireRestaurantPermissions(['restaurant:update'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Replace complete restaurant floor plan table set' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Persisted floor plan table collection.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiBadRequestResponse({
    description: 'Duplicate table numbers or invalid floor-plan payload.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing restaurant:update permission.' })
  @ApiNotFoundResponse({
    description: 'Restaurant or one of the provided table ids was not found.',
  })
  @ApiConflictResponse({
    description: 'Cannot remove tables still referenced by reservations or orders.',
  })
  replaceFloorPlan(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: ReplaceFloorPlanDto,
  ) {
    return this.restaurantsService.replaceFloorPlan(restaurantId, body);
  }

  @Post(':restaurantId/images')
  @RequireRestaurantPermissions(['restaurant:update'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Attach an existing image URL to restaurant gallery' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Restaurant record after image URL update.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid image URL payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing restaurant:update permission.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  addRestaurantImage(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantImageDto,
  ) {
    return this.restaurantsService.addRestaurantImage(restaurantId, body.url);
  }

  @Delete(':restaurantId/images')
  @RequireRestaurantPermissions(['restaurant:update'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Remove an image URL from restaurant gallery' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Restaurant record after image URL removal.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid image URL payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing restaurant:update permission.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found or image URL does not exist.' })
  removeRestaurantImage(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantImageDto,
  ) {
    return this.restaurantsService.removeRestaurantImage(restaurantId, body.url);
  }

  @Post(':restaurantId/menu-items')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Create a menu item for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Menu item created.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid menu item payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  createMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateMenuItemDto,
  ) {
    return this.restaurantsService.createMenuItem(restaurantId, body);
  }

  @Patch(':restaurantId/menu-items/:menuItemId')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'menuItemId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Menu item updated.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({
    description: 'No mutable fields were provided or payload validation failed.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Menu item not found for this restaurant.' })
  updateMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() body: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(restaurantId, menuItemId, body);
  }

  @Delete(':restaurantId/menu-items/:menuItemId')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Delete a menu item from a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'menuItemId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Deleted menu item payload.',
    schema: {
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Menu item not found for this restaurant.' })
  deleteMenuItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
  ) {
    return this.restaurantsService.deleteMenuItem(restaurantId, menuItemId);
  }

  @Get(':restaurantId/categories')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List menu item categories for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Menu item categories for this restaurant.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  getCategories(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.restaurantsService.getCategories(restaurantId);
  }

  @Post(':restaurantId/categories')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Create a menu item category for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Menu item category created.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid category payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  @ApiConflictResponse({ description: 'A category with this name already exists.' })
  createCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateMenuItemCategoryDto,
  ) {
    return this.restaurantsService.createCategory(restaurantId, body.name);
  }

  @Delete(':restaurantId/categories/:categoryId')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Delete a menu item category from a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'categoryId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Deleted menu item category payload.',
    schema: {
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Category not found for this restaurant.' })
  deleteCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.restaurantsService.deleteCategory(restaurantId, categoryId);
  }

  @Post(':restaurantId/menu-items/:menuItemId/categories')
  @RequireRestaurantPermissions(['menu:manage'])
  @ApiCookieAuth('session-cookie')
  @ApiOperation({ summary: 'Set categories for a menu item' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'menuItemId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Menu item with updated categories.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid category IDs or payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing menu:manage permission.' })
  @ApiNotFoundResponse({ description: 'Menu item not found for this restaurant.' })
  setMenuItemCategories(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() body: SetMenuItemCategoriesDto,
  ) {
    return this.restaurantsService.setMenuItemCategories(
      restaurantId,
      menuItemId,
      body.categoryIds,
    );
  }
}
