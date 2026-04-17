import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { staffRoles, type StaffRole } from '../lib/staff-role';

export class UpsertStaffRoleDto {
  @ApiProperty({
    example: '7f44699a-8dde-46ff-a8ac-ef0eb3dc51b8',
    description: 'User id to assign to this restaurant.',
  })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: staffRoles, example: 'employee' })
  @IsIn(staffRoles)
  role!: StaffRole;
}
