import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { OpeningHoursDto } from '../../common/dto/opening-hours.dto';

export class CreateAdminRestaurantDto {
  @ApiProperty({ example: 'Harbor Grill', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Fresh seafood and charcoal grills in a casual setting.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '123 Ocean Ave, Miami, FL', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  address!: string;

  @ApiProperty({ example: '+1 305 555 0101' })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ type: OpeningHoursDto })
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours!: OpeningHoursDto;

  @ApiPropertyOptional({
    type: [String],
    format: 'uri',
    example: ['https://cdn.smartdine.app/restaurants/harbor-grill/front.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({
    example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8',
    description: 'User id that will be assigned as owner for the restaurant.',
  })
  @IsString()
  ownerUserId!: string;
}
