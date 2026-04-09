import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { AdminService } from './admin.service';
import { CreateAdminRestaurantDto } from './dto/create-admin-restaurant.dto';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { UpdateRestaurantOwnerDto } from './dto/update-restaurant-owner.dto';

@Controller({
  path: 'admin',
  version: '1',
})
@RequirePermissions(['system:admin'])
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('restaurants')
  getRestaurants() {
    return this.adminService.getRestaurants();
  }

  @Post('restaurants')
  createRestaurant(@Body() body: CreateAdminRestaurantDto) {
    return this.adminService.createRestaurant(body);
  }

  @Delete('restaurants/:restaurantId')
  deleteRestaurant(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.adminService.deleteRestaurant(restaurantId);
  }

  @Get('users')
  getUsers(@Query() query: ListAdminUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('restaurants/:restaurantId/owner')
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
