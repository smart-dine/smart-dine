import { IsIn, IsOptional } from 'class-validator';
import { orderStatuses, type OrderStatus } from '../lib/order-status';

export class ListOrdersDto {
  @IsOptional()
  @IsIn(orderStatuses)
  status?: OrderStatus;
}
