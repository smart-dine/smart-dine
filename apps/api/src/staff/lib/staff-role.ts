export const staffRoles = ['owner', 'employee'] as const;

export type StaffRole = (typeof staffRoles)[number];
