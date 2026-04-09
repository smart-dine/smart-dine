import { Type } from 'class-transformer';
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
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MaxLength(500)
  address!: string;

  @IsPhoneNumber()
  phone!: string;

  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours!: OpeningHoursDto;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsString()
  ownerUserId!: string;
}
