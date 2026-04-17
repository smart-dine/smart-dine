import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { orderStatuses, type OrderStatus } from '../lib/order-status';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: orderStatuses,
    example: 'preparing',
    description: 'New order status.',
  })
  @IsIn(orderStatuses)
  status!: OrderStatus;
}
