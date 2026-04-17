import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompleteOrderDto {
  @ApiProperty({ example: '83629f40-ec0d-4c34-9ca8-fcb699febe89' })
  @IsUUID()
  orderId!: string;
}
