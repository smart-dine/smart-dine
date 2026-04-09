import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { staffRoles, type StaffRole } from '../lib/staff-role';

export class UpdateStaffRoleDto {
  @ApiProperty({
    enum: staffRoles,
    example: 'employee',
    description: 'Role assigned to the staff member within the restaurant.',
  })
  @IsIn(staffRoles)
  role!: StaffRole;
}
