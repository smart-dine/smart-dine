import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { orderItemStatuses, type OrderItemStatus } from '../lib/order-status';

export class UpdateOrderItemStatusDto {
  @ApiProperty({
    enum: orderItemStatuses,
    example: 'completed',
    description: 'New order item status.',
  })
  @IsIn(orderItemStatuses)
  status!: OrderItemStatus;
}
