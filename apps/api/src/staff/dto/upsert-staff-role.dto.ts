import { IsIn, IsString } from 'class-validator';
import { staffRoles, type StaffRole } from '../lib/staff-role';

export class UpsertStaffRoleDto {
  @IsString()
  userId!: string;

  @IsIn(staffRoles)
  role!: StaffRole;
}
