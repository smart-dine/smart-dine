import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  RequirePermissions,
  RequireRestaurantPermissions,
} from './decorators/require-permissions.decorator';

@Controller({
  path: 'rbac',
  version: '1',
})
@ApiTags('RBAC')
@ApiCookieAuth('session-cookie')
export class RbacController {
  @Get('session-role')
  @ApiOperation({ summary: 'Get the authenticated user role from session' })
  @ApiOkResponse({
    description: 'Current user role resolved from session.',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8' },
        userRole: { type: 'string', example: 'owner' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getSessionRole(@Session() session: UserSession) {
    return {
      userId: session.user.id,
      userRole: session.user.role ?? 'user',
    };
  }

  @Get('restaurants/:restaurantId/dashboard')
  @RequireRestaurantPermissions(['restaurant:read'])
  @ApiOperation({ summary: 'Check read access to a restaurant dashboard scope' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Permission check passed for restaurant read scope.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        restaurantId: { type: 'string', example: 'd4b6a6ad-9d98-4d9c-99d8-b35fa2f3404d' },
        userId: { type: 'string', example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8' },
        scope: { type: 'string', example: 'restaurant:read' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing required restaurant permissions.' })
  getRestaurantDashboard(
    @Param('restaurantId') restaurantId: string,
    @Session() session: UserSession,
  ) {
    return {
      allowed: true,
      restaurantId,
      userId: session.user.id,
      scope: 'restaurant:read',
    };
  }

  @Get('restaurants/:restaurantId/staff')
  @RequireRestaurantPermissions(['staff:manage'])
  @ApiOperation({ summary: 'Check staff-management permission scope for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Permission check passed for staff management scope.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        restaurantId: { type: 'string', example: 'd4b6a6ad-9d98-4d9c-99d8-b35fa2f3404d' },
        userId: { type: 'string', example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8' },
        scope: { type: 'string', example: 'staff:manage' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing required restaurant permissions.' })
  getRestaurantStaffPanel(
    @Param('restaurantId') restaurantId: string,
    @Session() session: UserSession,
  ) {
    return {
      allowed: true,
      restaurantId,
      userId: session.user.id,
      scope: 'staff:manage',
    };
  }

  @Get('platform/admin')
  @RequirePermissions(['system:admin'])
  @ApiOperation({ summary: 'Check system admin scope' })
  @ApiOkResponse({
    description: 'Permission check passed for system admin scope.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        userId: { type: 'string', example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8' },
        scope: { type: 'string', example: 'system:admin' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'System admin role is required.' })
  getPlatformAdminScope(@Session() session: UserSession) {
    return {
      allowed: true,
      userId: session.user.id,
      scope: 'system:admin',
    };
  }
}
