import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class ReservationAvailabilityDto {
  @IsDateString()
  from!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize!: number;
}
