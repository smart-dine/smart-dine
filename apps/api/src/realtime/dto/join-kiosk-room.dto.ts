import { IsUUID } from 'class-validator';

export class JoinKioskRoomDto {
  @IsUUID()
  restaurantId!: string;
}
