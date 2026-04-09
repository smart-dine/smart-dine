import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateNested } from 'class-validator';
import { OpeningHoursDto } from '../../common/dto/opening-hours.dto';
import { Type } from 'class-transformer';

export class RestaurantMutableFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @Matches(/^\+?[0-9()\-\s]{7,25}$/)
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

export class UpdateRestaurantDto extends PartialType(RestaurantMutableFieldsDto) {}
