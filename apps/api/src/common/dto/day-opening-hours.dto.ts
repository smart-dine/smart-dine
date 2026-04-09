import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, Matches } from 'class-validator';

export class DayOpeningHoursDto {
  @ApiProperty({
    example: '09:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
    description: 'Opening time in 24h HH:mm format.',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opens!: string;

  @ApiProperty({
    example: '22:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
    description: 'Closing time in 24h HH:mm format.',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closes!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the restaurant is closed for the entire day.',
  })
  @IsBoolean()
  isClosed!: boolean;
}
