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
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { AdminService } from './admin.service';
import { CreateAdminRestaurantDto } from './dto/create-admin-restaurant.dto';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { UpdateRestaurantOwnerDto } from './dto/update-restaurant-owner.dto';

@Controller({
  path: 'admin',
  version: '1',
})
@ApiTags('Admin')
@ApiCookieAuth('session-cookie')
@RequirePermissions(['system:admin'])
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('restaurants')
  @ApiOperation({ summary: 'List all restaurants with owner assignments' })
  @ApiOkResponse({
    description: 'Returns all restaurants and owner role assignments.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  getRestaurants() {
    return this.adminService.getRestaurants();
  }

  @Post('restaurants')
  @ApiOperation({ summary: 'Create a restaurant and assign an owner user' })
  @ApiCreatedResponse({
    description: 'Restaurant created successfully.',
    schema: {
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  @ApiNotFoundResponse({ description: 'Owner user was not found.' })
  createRestaurant(@Body() body: CreateAdminRestaurantDto) {
    return this.adminService.createRestaurant(body);
  }

  @Delete('restaurants/:restaurantId')
  @ApiOperation({ summary: 'Delete a restaurant by id' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Deletion result.',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'boolean', example: true },
        restaurantId: { type: 'string', example: 'd4b6a6ad-9d98-4d9c-99d8-b35fa2f3404d' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  deleteRestaurant(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.adminService.deleteRestaurant(restaurantId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users for admin operations' })
  @ApiOkResponse({
    description: 'User list for admin dashboard.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  getUsers(@Query() query: ListAdminUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('restaurants/:restaurantId/owner')
  @ApiOperation({ summary: 'Assign or promote a restaurant owner user' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Owner assignment record.',
    schema: {
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  @ApiNotFoundResponse({ description: 'Restaurant or owner user was not found.' })
  updateRestaurantOwner(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpdateRestaurantOwnerDto,
  ) {
    return this.adminService.assignRestaurantOwner({
      restaurantId,
      ownerUserId: body.ownerUserId,
    });
  }
}
