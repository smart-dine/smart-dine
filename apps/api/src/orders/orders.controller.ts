import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
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
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller({
  path: '',
  version: '1',
})
@ApiTags('Orders')
@ApiCookieAuth('session-cookie')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('restaurants/:restaurantId/orders')
  @RequireRestaurantPermissions(['orders:manage'])
  @ApiOperation({ summary: 'Create a new order for a restaurant table' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid order payload or one or more menu items are unavailable.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing orders:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Restaurant table was not found.' })
  createOrder(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateOrderDto,
    @Session() session: UserSession,
  ) {
    return this.ordersService.createOrder({ restaurantId, body, session });
  }

  @Get('restaurants/:restaurantId/orders')
  @RequireRestaurantPermissions(['orders:manage'])
  @ApiOperation({ summary: 'List orders for a restaurant, optionally filtered by status' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Orders for the restaurant.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameter values.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing orders:manage permission for restaurant.' })
  getRestaurantOrders(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: ListOrdersDto,
  ) {
    return this.ordersService.getRestaurantOrders(restaurantId, query.status);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get a single order by id' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order details with line items.',
    schema: {
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing permission to access this order.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  getOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @Session() session: UserSession) {
    return this.ordersService.getOrder(orderId, session);
  }

  @Patch('orders/:orderId/status')
  @ApiOperation({ summary: 'Update status of an existing order' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order status updated.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid status value.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing permission to modify this order.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: UpdateOrderStatusDto,
    @Session() session: UserSession,
  ) {
    return this.ordersService.updateOrderStatus({
      orderId,
      status: body.status,
      session,
    });
  }
}
