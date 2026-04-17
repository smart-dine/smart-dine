import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRestaurantOwnerDto {
  @ApiProperty({
    example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8',
    description: 'User id to assign as owner for this restaurant.',
  })
  @IsString()
  ownerUserId!: string;
}
