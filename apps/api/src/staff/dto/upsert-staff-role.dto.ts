import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';
import { staffRoles, type StaffRole } from '../lib/staff-role';

export class UpsertStaffRoleDto {
  @ApiProperty({
    example: 'owner@harborgrill.com',
    format: 'email',
    description: 'User email to assign to this restaurant.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: staffRoles, example: 'employee' })
  @IsIn(staffRoles)
  role!: StaffRole;
}
