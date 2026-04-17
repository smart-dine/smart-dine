import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: '9db6c623-9ec3-427d-afc6-83d8e2b353ec' })
  @IsUUID()
  tableId!: string;

  @ApiProperty({
    example: '2026-04-10T18:30:00.000Z',
    format: 'date-time',
    description: 'Reservation start time in ISO 8601 format.',
  })
  @IsDateString()
  reservationTime!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  partySize!: number;
}
