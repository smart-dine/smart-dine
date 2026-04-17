import { adminQueryOptions } from '#/lib/api/admin';
import { formatDateTime } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartdine/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Users } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const restaurantsQuery = useQuery(adminQueryOptions.restaurants());
  const usersQuery = useQuery(
    adminQueryOptions.users({
      offset: 0,
      limit: 10,
    }),
  );

  const restaurants = restaurantsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <section className='grid gap-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm font-medium'>Restaurants</CardTitle>
            <Building2 className='text-muted-foreground size-4' />
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{restaurants.length}</p>
            <p className='text-muted-foreground text-xs'>Registered venues across the platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm font-medium'>Users</CardTitle>
            <Users className='text-muted-foreground size-4' />
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{users.length}</p>
            <p className='text-muted-foreground text-xs'>Most recent users in directory sample</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Restaurants</CardTitle>
          <CardDescription>Latest venues and their owner assignments.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {restaurantsQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading restaurants...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.slice(0, 8).map((restaurant) => {
                  const owner = restaurant.staffRoles.find((role) => role.role === 'owner')?.user;

                  return (
                    <TableRow key={restaurant.id}>
                      <TableCell className='font-medium'>{restaurant.name}</TableCell>
                      <TableCell>
                        {owner ? (
                          <div className='space-y-1'>
                            <p className='text-sm font-medium'>{owner.name}</p>
                            <p className='text-muted-foreground text-xs'>{owner.email}</p>
                          </div>
                        ) : (
                          <Badge variant='destructive'>Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {formatDateTime(restaurant.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
