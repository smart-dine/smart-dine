import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RequireRestaurantPermissions } from '../rbac/decorators/require-permissions.decorator';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UpsertStaffRoleDto } from './dto/upsert-staff-role.dto';
import { StaffService } from './staff.service';

@Controller({
  path: '',
  version: '1',
})
@ApiTags('Staff')
@ApiCookieAuth('session-cookie')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('my/restaurants')
  @ApiOperation({ summary: 'List restaurants where the current user has a staff role' })
  @ApiOkResponse({
    description: 'Staff-role memberships for current user.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getMyRestaurants(@Session() session: UserSession) {
    return this.staffService.getMyRestaurants(session.user.id);
  }

  @Get('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  @ApiOperation({ summary: 'List staff assignments for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Staff assignment records for the restaurant.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing staff:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  getRestaurantStaff(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.staffService.getRestaurantStaff(restaurantId);
  }

  @Post('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  @ApiOperation({ summary: 'Assign a user to a staff role for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Staff role assignment created.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'User is already assigned to this restaurant.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing staff:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Restaurant or user not found.' })
  addStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: UpsertStaffRoleDto,
  ) {
    return this.staffService.addStaffRole(restaurantId, body);
  }

  @Patch('restaurants/:restaurantId/staff/:staffRoleId')
  @RequireRestaurantPermissions(['staff:manage'])
  @ApiOperation({ summary: 'Update a staff role assignment for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'staffRoleId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Staff role assignment updated.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Restaurant must always have at least one owner.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing staff:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Staff assignment not found.' })
  updateStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('staffRoleId', ParseUUIDPipe) staffRoleId: string,
    @Body() body: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(restaurantId, staffRoleId, body);
  }

  @Delete('restaurants/:restaurantId/staff/:staffRoleId')
  @RequireRestaurantPermissions(['staff:manage'])
  @ApiOperation({ summary: 'Remove a staff role assignment from a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiParam({ name: 'staffRoleId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Staff role assignment removed.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Restaurant must always have at least one owner.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing staff:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Staff assignment not found.' })
  removeStaffRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('staffRoleId', ParseUUIDPipe) staffRoleId: string,
  ) {
    return this.staffService.removeStaffRole(restaurantId, staffRoleId);
  }
}
