import { IsIn } from 'class-validator';
import { staffRoles, type StaffRole } from '../lib/staff-role';

export class UpdateStaffRoleDto {
  @IsIn(staffRoles)
  role!: StaffRole;
}
