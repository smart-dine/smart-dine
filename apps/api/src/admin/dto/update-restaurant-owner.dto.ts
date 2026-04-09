import { IsString } from 'class-validator';

export class UpdateRestaurantOwnerDto {
  @IsString()
  ownerUserId!: string;
}
