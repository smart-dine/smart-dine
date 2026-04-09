import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RequireRestaurantPermissions } from '../rbac/decorators/require-permissions.decorator';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UpsertStaffRoleDto } from './dto/upsert-staff-role.dto';
import { StaffService } from './staff.service';

@Controller({
  path: '',
  version: '1',
})
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('my/restaurants')
  getMyRestaurants(@Session() session: UserSession) {
    return this.staffService.getMyRestaurants(session.user.id);
  }

  @Get('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  getRestaurantStaff(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.staffService.getRestaurantStaff(restaurantId);
  }

  @Post('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  addStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpsertStaffRoleDto,
  ) {
    return this.staffService.addStaffRole(restaurantId, body);
  }

  @Patch('restaurants/:restaurantId/staff/:staffRoleId')
  @RequireRestaurantPermissions(['staff:manage'])
  updateStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('staffRoleId', ParseUUIDPipe) staffRoleId: string,
    @Body() body: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(restaurantId, staffRoleId, body);
  }

  @Delete('restaurants/:restaurantId/staff/:staffRoleId')
  @RequireRestaurantPermissions(['staff:manage'])
  removeStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('staffRoleId', ParseUUIDPipe) staffRoleId: string,
  ) {
    return this.staffService.removeStaffRole(restaurantId, staffRoleId);
  }
}
