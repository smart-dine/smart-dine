import { useRestaurantRouteAccess } from '#/lib/auth/access';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { LayoutDashboard, SquareMenu } from 'lucide-react';

export const Route = createFileRoute('/restaurants/$restaurantId/admin')({
  component: RestaurantAdminLayout,
});

function RestaurantAdminLayout() {
  const { restaurantId } = Route.useParams();

  const access = useRestaurantRouteAccess(restaurantId, 'admin');
  const restaurantQuery = useQuery(restaurantsQueryOptions.detail(restaurantId));

  if (access.isLoading) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Checking access</CardTitle>
            <CardDescription>Verifying your restaurant permissions.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!access.isAuthenticated) {
    return (
      <Navigate
        to='/sign-in'
        replace
      />
    );
  }

  if (!access.canAccess) {
    return (
      <Navigate
        to='/'
        replace
      />
    );
  }

  return (
    <main className='container mx-auto flex flex-col gap-6 px-4 py-8'>
      <section className='bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm'>
        <div className='bg-primary/10 absolute -top-20 -right-20 size-56 rounded-full blur-3xl' />
        <div className='relative z-10 space-y-3'>
          <p className='text-primary inline-flex items-center gap-2 text-sm font-medium'>
            <LayoutDashboard className='size-4' />
            Restaurant Admin
          </p>
          <h1 className='text-3xl font-semibold tracking-tight'>
            {restaurantQuery.data?.name ?? 'Restaurant workspace'}
          </h1>
          <p className='text-muted-foreground max-w-3xl'>
            Manage menu, floor plan, staff, reservations, and operations in one place.
          </p>

          <div className='mt-4 flex flex-wrap gap-2'>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin'
                params={{ restaurantId }}
              >
                Overview
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin/menu'
                params={{ restaurantId }}
              >
                Menu
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin/floor-plan'
                params={{ restaurantId }}
              >
                Floor Plan
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin/staff'
                params={{ restaurantId }}
              >
                Staff
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin/reservations'
                params={{ restaurantId }}
              >
                Reservations
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
            >
              <Link
                to='/restaurants/$restaurantId/admin/orders'
                params={{ restaurantId }}
              >
                Orders
              </Link>
            </Button>
            <Button
              asChild
              variant='secondary'
            >
              <Link
                to='/restaurants/$restaurantId/cashier'
                params={{ restaurantId }}
              >
                <SquareMenu className='mr-1 size-4' />
                Cashier
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Outlet />
    </main>
  );
}
