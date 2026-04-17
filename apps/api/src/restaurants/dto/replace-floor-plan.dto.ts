import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const tableShapes = ['round', 'rectangle'] as const;

export class FloorPlanTableDto {
  @ApiPropertyOptional({
    example: '06c8c2f8-aa75-4a41-a79e-51f6f0014962',
    description: 'Provide for existing tables to update; omit for new tables.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'A1', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tableNumber!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity!: number;

  @ApiProperty({
    example: 120,
    minimum: 0,
    maximum: 10000,
    description: 'Horizontal coordinate in floor map units.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  xCoordinate!: number;

  @ApiProperty({
    example: 64,
    minimum: 0,
    maximum: 10000,
    description: 'Vertical coordinate in floor map units.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  yCoordinate!: number;

  @ApiProperty({ enum: tableShapes, example: 'round' })
  @IsIn(tableShapes)
  shape!: (typeof tableShapes)[number];
}

export class ReplaceFloorPlanDto {
  @ApiProperty({
    type: [FloorPlanTableDto],
    maxItems: 300,
    description: 'Complete replacement set of all tables for the restaurant floor plan.',
  })
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => FloorPlanTableDto)
  tables!: FloorPlanTableDto[];
}
