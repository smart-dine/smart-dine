import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: '45404d6e-1f7a-4754-a2e8-c5ea03dfcc07' })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @ApiPropertyOptional({
    example: 'No onions please.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: '9db6c623-9ec3-427d-afc6-83d8e2b353ec' })
  @IsUUID()
  tableId!: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
