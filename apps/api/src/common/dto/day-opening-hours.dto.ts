import { IsBoolean, Matches } from 'class-validator';

export class DayOpeningHoursDto {
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opens!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closes!: string;

  @IsBoolean()
  isClosed!: boolean;
}
