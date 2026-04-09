import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { OpeningHoursDto } from '../../common/dto/opening-hours.dto';
import { Type } from 'class-transformer';

export class RestaurantMutableFieldsDto {
  @ApiPropertyOptional({ example: 'Harbor Grill', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Seafood and grill favorites served all day.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '123 Ocean Ave, Miami, FL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    example: '+1 305 555 0101',
    pattern: '^\\+?[0-9()\\-\\s]{7,25}$',
  })
  @IsOptional()
  @Matches(/^\+?[0-9()\-\s]{7,25}$/)
  phone?: string;

  @ApiPropertyOptional({ type: OpeningHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

  @ApiPropertyOptional({
    type: [String],
    format: 'uri',
    example: ['https://cdn.smartdine.app/restaurants/harbor-grill/front.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

export class UpdateRestaurantDto extends PartialType(RestaurantMutableFieldsDto) {}
