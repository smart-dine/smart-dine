import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { DayOpeningHoursDto } from './day-opening-hours.dto';

export class OpeningHoursDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  monday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  tuesday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  wednesday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  thursday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  friday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  saturday!: DayOpeningHoursDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  sunday!: DayOpeningHoursDto;
}
