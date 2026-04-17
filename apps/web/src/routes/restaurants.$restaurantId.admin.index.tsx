import { ordersQueryOptions } from '#/lib/api/orders';
import { reservationsQueryOptions } from '#/lib/api/reservations';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { staffQueryOptions } from '#/lib/api/staff';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpenCheck, CalendarClock, ClipboardList, Users } from 'lucide-react';

export const Route = createFileRoute('/restaurants/$restaurantId/admin/')({
  component: RestaurantAdminOverviewPage,
});

function RestaurantAdminOverviewPage() {
  const { restaurantId } = Route.useParams();

  const menuQuery = useQuery(restaurantsQueryOptions.menu(restaurantId));
  const staffQuery = useQuery(staffQueryOptions.restaurantStaff(restaurantId));
  const reservationsQuery = useQuery(reservationsQueryOptions.restaurantReservations(restaurantId));
  const ordersQuery = useQuery(ordersQueryOptions.restaurantOrders(restaurantId));

  const pendingReservations = (reservationsQuery.data ?? []).filter(
    (reservation) => reservation.status === 'pending',
  ).length;

  const activeOrders = (ordersQuery.data ?? []).filter(
    (order) => order.status !== 'completed',
  ).length;

  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Menu Items</CardTitle>
          <BookOpenCheck className='text-muted-foreground size-4' />
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-semibold'>{menuQuery.data?.length ?? 0}</p>
          <p className='text-muted-foreground text-xs'>Active catalog entries</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Staff</CardTitle>
          <Users className='text-muted-foreground size-4' />
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-semibold'>{staffQuery.data?.length ?? 0}</p>
          <p className='text-muted-foreground text-xs'>Assigned members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Pending Reservations</CardTitle>
          <CalendarClock className='text-muted-foreground size-4' />
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-semibold'>{pendingReservations}</p>
          <p className='text-muted-foreground text-xs'>Awaiting confirmation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Open Orders</CardTitle>
          <ClipboardList className='text-muted-foreground size-4' />
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-semibold'>{activeOrders}</p>
          <p className='text-muted-foreground text-xs'>Placed, preparing, or ready</p>
        </CardContent>
      </Card>

      <Card className='md:col-span-2 xl:col-span-4'>
        <CardHeader>
          <CardTitle>Operations Snapshot</CardTitle>
          <CardDescription>
            This dashboard summarizes restaurant activity to guide your next operational actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Use the tabs above to manage menu and floor plan updates, keep staffing current, and
            process reservations and orders.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
