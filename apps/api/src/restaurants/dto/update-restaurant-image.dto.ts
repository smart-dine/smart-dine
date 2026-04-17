import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class UpdateRestaurantImageDto {
  @ApiProperty({
    example: 'https://cdn.smartdine.app/restaurants/harbor-grill/front.jpg',
    format: 'uri',
  })
  @IsUrl()
  url!: string;
}
