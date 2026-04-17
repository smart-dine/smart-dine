import { addStaffRole, removeStaffRole, staffQueryOptions, updateStaffRole } from '#/lib/api/staff';
import type { StaffRole } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
import { Label } from '@smartdine/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartdine/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartdine/ui/components/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

const staffRoles: StaffRole[] = ['owner', 'employee'];

export const Route = createFileRoute('/restaurants/$restaurantId/admin/staff')({
  component: RestaurantStaffPage,
});

function RestaurantStaffPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();

  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('employee');
  const [roleDraftByStaffId, setRoleDraftByStaffId] = useState<Record<string, StaffRole>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  const staffQuery = useQuery(staffQueryOptions.restaurantStaff(restaurantId));

  const invalidateStaff = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['staff', 'restaurant', restaurantId],
    });
  };

  const addMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: StaffRole }) =>
      addStaffRole(restaurantId, { userId, role }),
    onSuccess: async () => {
      setNewUserId('');
      setNewRole('employee');
      setPageError(null);
      await invalidateStaff();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to add staff role.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ staffRoleId, role }: { staffRoleId: string; role: StaffRole }) =>
      updateStaffRole(restaurantId, staffRoleId, { role }),
    onSuccess: async () => {
      setPageError(null);
      await invalidateStaff();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to update staff role.'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (staffRoleId: string) => removeStaffRole(restaurantId, staffRoleId),
    onSuccess: async () => {
      setPageError(null);
      await invalidateStaff();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to remove staff role.'));
    },
  });

  const staff = staffQuery.data ?? [];

  return (
    <div className='grid gap-4 lg:grid-cols-[1fr_2fr]'>
      <Card>
        <CardHeader>
          <CardTitle>Assign Staff Role</CardTitle>
          <CardDescription>
            Add by user id and role. You can copy user ids from the site admin user list.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className='space-y-3'
            onSubmit={(event) => {
              event.preventDefault();
              addMutation.mutate({
                userId: newUserId,
                role: newRole,
              });
            }}
          >
            <div className='grid gap-2'>
              <Label htmlFor='staff-user-id'>User ID</Label>
              <Input
                id='staff-user-id'
                value={newUserId}
                onChange={(event) => setNewUserId(event.target.value)}
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label>Role</Label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as StaffRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={addMutation.isPending}
            >
              Add staff member
            </Button>

            {pageError && <p className='text-destructive text-sm'>{pageError}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Team</CardTitle>
          <CardDescription>Update role assignments and remove members when needed.</CardDescription>
        </CardHeader>

        <CardContent>
          {staffQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading staff...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {staff.map((staffRole) => {
                  const selectedRole = roleDraftByStaffId[staffRole.id] ?? (staffRole.role as StaffRole);

                  return (
                    <TableRow key={staffRole.id}>
                      <TableCell className='font-medium'>{staffRole.user.name}</TableCell>
                      <TableCell>{staffRole.user.email}</TableCell>
                      <TableCell>
                        <Badge variant={staffRole.role === 'owner' ? 'default' : 'secondary'}>
                          {staffRole.role}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Select
                            value={selectedRole}
                            onValueChange={(value) =>
                              setRoleDraftByStaffId((current) => ({
                                ...current,
                                [staffRole.id]: value as StaffRole,
                              }))
                            }
                          >
                            <SelectTrigger className='w-32'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {staffRoles.map((role) => (
                                <SelectItem
                                  key={role}
                                  value={role}
                                >
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            variant='outline'
                            size='sm'
                            disabled={selectedRole === staffRole.role || updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({
                                staffRoleId: staffRole.id,
                                role: selectedRole,
                              })
                            }
                          >
                            Save
                          </Button>

                          <Button
                            variant='destructive'
                            size='sm'
                            disabled={removeMutation.isPending}
                            onClick={() => removeMutation.mutate(staffRole.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {staff.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-muted-foreground py-8 text-center'
                    >
                      No staff assigned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
