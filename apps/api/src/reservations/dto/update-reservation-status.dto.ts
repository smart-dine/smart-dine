import { IsIn } from 'class-validator';
import { reservationStatuses, type ReservationStatus } from '../lib/reservation-status';

export class UpdateReservationStatusDto {
  @IsIn(reservationStatuses)
  status!: ReservationStatus;
}
