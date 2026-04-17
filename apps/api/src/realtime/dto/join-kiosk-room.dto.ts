import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class JoinKioskRoomDto {
  @ApiProperty({ example: 'd4b6a6ad-9d98-4d9c-99d8-b35fa2f3404d' })
  @IsUUID()
  restaurantId!: string;
}
