import { IsDateString, IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  tableId!: string;

  @IsDateString()
  reservationTime!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  partySize!: number;
}
