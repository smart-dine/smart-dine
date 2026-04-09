import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { reservationStatuses, type ReservationStatus } from '../lib/reservation-status';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: reservationStatuses,
    example: 'confirmed',
    description: 'New reservation status.',
  })
  @IsIn(reservationStatuses)
  status!: ReservationStatus;
}
