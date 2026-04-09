import { Controller, Get, Param } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions, RequireRestaurantPermissions } from './decorators/require-permissions.decorator';

@Controller({
  path: 'rbac',
  version: '1',
})
export class RbacController {
  @Get('session-role')
  getSessionRole(@Session() session: UserSession) {
    return {
      userId: session.user.id,
      userRole: session.user.role ?? 'user',
    };
  }

  @Get('restaurants/:restaurantId/dashboard')
  @RequireRestaurantPermissions(['restaurant:read'])
  getRestaurantDashboard(@Param('restaurantId') restaurantId: string, @Session() session: UserSession) {
    return {
      allowed: true,
      restaurantId,
      userId: session.user.id,
      scope: 'restaurant:read',
    };
  }

  @Get('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  getRestaurantStaffPanel(@Param('restaurantId') restaurantId: string, @Session() session: UserSession) {
    return {
      allowed: true,
      restaurantId,
      userId: session.user.id,
      scope: 'staff:manage',
    };
  }

  @Get('platform/admin')
  @RequirePermissions(['system:admin'])
  getPlatformAdminScope(@Session() session: UserSession) {
    return {
      allowed: true,
      userId: session.user.id,
      scope: 'system:admin',
    };
  }
}
