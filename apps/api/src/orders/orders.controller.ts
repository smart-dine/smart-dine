import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
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
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('restaurants/:restaurantId/orders')
  @RequireRestaurantPermissions(['orders:manage'])
  createOrder(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateOrderDto,
    @Session() session: UserSession,
  ) {
    return this.ordersService.createOrder({ restaurantId, body, session });
  }

  @Get('restaurants/:restaurantId/orders')
  @RequireRestaurantPermissions(['orders:manage'])
  getRestaurantOrders(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: ListOrdersDto,
  ) {
    return this.ordersService.getRestaurantOrders(restaurantId, query.status);
  }

  @Get('orders/:orderId')
  getOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @Session() session: UserSession) {
    return this.ordersService.getOrder(orderId, session);
  }

  @Patch('orders/:orderId/status')
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
