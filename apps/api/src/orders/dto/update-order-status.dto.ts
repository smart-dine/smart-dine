import { IsIn } from 'class-validator';
import { orderStatuses, type OrderStatus } from '../lib/order-status';

export class UpdateOrderStatusDto {
  @IsIn(orderStatuses)
  status!: OrderStatus;
}
