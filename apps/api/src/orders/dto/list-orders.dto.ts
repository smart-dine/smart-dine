import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { orderStatuses, type OrderStatus } from '../lib/order-status';

export class ListOrdersDto {
  @ApiPropertyOptional({
    enum: orderStatuses,
    example: 'placed',
    description: 'Optional order status filter.',
  })
  @IsOptional()
  @IsIn(orderStatuses)
  status?: OrderStatus;
}
