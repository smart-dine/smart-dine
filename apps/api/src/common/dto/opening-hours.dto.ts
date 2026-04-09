import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, ValidateNested } from 'class-validator';
import { DayOpeningHoursDto } from './day-opening-hours.dto';

export class OpeningHoursDto {
  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  monday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  tuesday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  wednesday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  thursday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  friday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  saturday!: DayOpeningHoursDto;

  @ApiProperty({ type: DayOpeningHoursDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DayOpeningHoursDto)
  sunday!: DayOpeningHoursDto;
}
