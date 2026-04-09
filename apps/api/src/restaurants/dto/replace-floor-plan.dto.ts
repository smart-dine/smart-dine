import { Type } from 'class-transformer';
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
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tableNumber!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  xCoordinate!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  yCoordinate!: number;

  @IsIn(tableShapes)
  shape!: (typeof tableShapes)[number];
}

export class ReplaceFloorPlanDto {
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => FloorPlanTableDto)
  tables!: FloorPlanTableDto[];
}
