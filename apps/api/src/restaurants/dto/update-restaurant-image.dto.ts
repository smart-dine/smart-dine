import { IsUrl } from 'class-validator';

export class UpdateRestaurantImageDto {
  @IsUrl()
  url!: string;
}
