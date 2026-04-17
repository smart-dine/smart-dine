import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class ReservationAvailabilityDto {
  @ApiProperty({
    example: '2026-04-10T18:30:00.000Z',
    format: 'date-time',
    description: 'Requested reservation start time in ISO 8601 format.',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
    description: 'Minimum number of seats required.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize!: number;
}
