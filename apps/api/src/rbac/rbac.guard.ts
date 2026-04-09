import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC_CONTEXT_OPTIONS_KEY, RBAC_PERMISSIONS_KEY } from './rbac.constants';
import { RbacService } from './rbac.service';
import type { AuthenticatedRequest, RestaurantContextOptions } from './lib/types';
import type { RbacPermission } from './lib/permissions';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<readonly RbacPermission[]>(RBAC_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = request.session;

    if (!session?.user?.id) {
      throw new UnauthorizedException('Authentication is required');
    }

    const contextOptions =
      this.reflector.getAllAndOverride<RestaurantContextOptions>(RBAC_CONTEXT_OPTIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? {};

    const restaurantId = this.extractRestaurantId(request, contextOptions);
    if (contextOptions.requireRestaurantContext && !restaurantId) {
      throw new ForbiddenException('restaurantId is required for this route');
    }

    const hasAccess = await this.rbacService.hasPermissions({
      session,
      permissions: requiredPermissions,
      restaurantId,
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have the required permissions');
    }

    return true;
  }

  private extractRestaurantId(
    request: AuthenticatedRequest,
    options: RestaurantContextOptions,
  ): string | undefined {
    const paramKey = options.restaurantIdParam ?? 'restaurantId';
    const bodyKey = options.restaurantIdBody ?? 'restaurantId';
    const queryKey = options.restaurantIdQuery ?? 'restaurantId';

    return (
      this.getStringValue(request.params, paramKey) ??
      this.getStringValue(request.body as Record<string, unknown>, bodyKey) ??
      this.getStringValue(request.query as Record<string, unknown>, queryKey)
    );
  }

  private getStringValue(source: Record<string, unknown> | undefined, key: string): string | undefined {
    if (!source) {
      return undefined;
    }

    const value = source[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
      return value[0];
    }

    return undefined;
  }
}
