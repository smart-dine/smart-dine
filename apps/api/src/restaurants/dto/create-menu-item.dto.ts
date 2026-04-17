import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Spicy Tuna Roll', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Fresh tuna, avocado, and house chili sauce.', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: 1899,
    minimum: 1,
    maximum: 10000000,
    description: 'Price in minor currency units (e.g. cents).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  price!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this menu item is currently available to order.',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.smartdine.app/menu-items/spicy-tuna.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}
