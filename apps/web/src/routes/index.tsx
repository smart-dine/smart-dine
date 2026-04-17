import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { authClient } from '#/lib/auth-client';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Building2, ChefHat, LayoutDashboard, Monitor, SquareMenu } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const { data: session } = authClient.useSession();

  const restaurantsQuery = useQuery(restaurantsQueryOptions.list({ limit: 6, offset: 0 }));

  const restaurants = restaurantsQuery.data ?? [];

  return (
    <main className='container mx-auto flex flex-col gap-10 px-4 py-8 md:py-12'>
      <section className='bg-card relative overflow-hidden rounded-3xl border p-8 shadow-sm md:p-12'>
        <div className='from-primary/15 absolute top-10 -left-28 size-56 rounded-full bg-linear-to-br to-transparent blur-3xl' />
        <div className='bg-primary/10 absolute -right-20 -bottom-24 size-72 rounded-full blur-3xl' />

        <div className='relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end'>
          <div className='space-y-4'>
            <Badge variant='secondary'>Smart Dine Platform</Badge>
            <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>
              Run modern restaurant operations from one connected platform.
            </h1>
            <p className='text-muted-foreground max-w-2xl text-base md:text-lg'>
              Smart Dine brings reservations, kitchen flow, cashier order creation, and admin
              controls together so your team can stay aligned during every service window.
            </p>

            <div className='flex flex-wrap gap-3'>
              {session?.user ? (
                <Button asChild>
                  <Link to='/workspace'>
                    Open Workspace
                    <ArrowRight className='ml-1 size-4' />
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to='/sign-in'>
                    Sign in to Start
                    <ArrowRight className='ml-1 size-4' />
                  </Link>
                </Button>
              )}

              {session?.user ? (
                <Button
                  asChild
                  variant='outline'
                >
                  <Link to='/admin'>Open Admin</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant='outline'
                >
                  <Link to='/sign-up'>Create Account</Link>
                </Button>
              )}
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-1'>
            <Card className='bg-background/80 border-dashed'>
              <CardContent className='flex items-center gap-3 p-4'>
                <LayoutDashboard className='text-primary size-5' />
                <div>
                  <p className='text-sm font-medium'>Site Admin</p>
                  <p className='text-muted-foreground text-xs'>Users, ownership, and restaurants</p>
                </div>
              </CardContent>
            </Card>
            <Card className='bg-background/80 border-dashed'>
              <CardContent className='flex items-center gap-3 p-4'>
                <SquareMenu className='text-primary size-5' />
                <div>
                  <p className='text-sm font-medium'>Cashier</p>
                  <p className='text-muted-foreground text-xs'>Fast table order construction</p>
                </div>
              </CardContent>
            </Card>
            <Card className='bg-background/80 border-dashed'>
              <CardContent className='flex items-center gap-3 p-4'>
                <Monitor className='text-primary size-5' />
                <div>
                  <p className='text-sm font-medium'>Kitchen Kiosk</p>
                  <p className='text-muted-foreground text-xs'>
                    Realtime order stream + completion
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='inline-flex items-center gap-2 text-lg'>
              <Building2 className='size-4' />
              Multi-Restaurant Admin
            </CardTitle>
            <CardDescription>
              Keep portfolio-wide restaurant and owner management in one control plane.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='inline-flex items-center gap-2 text-lg'>
              <ChefHat className='size-4' />
              Service-Time Execution
            </CardTitle>
            <CardDescription>
              Coordinate menu availability, reservations, staffing, and kitchen flow from live data.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='inline-flex items-center gap-2 text-lg'>
              <Monitor className='size-4' />
              Realtime Kiosk Signals
            </CardTitle>
            <CardDescription>
              Receive instant order events and complete tickets directly from the kiosk board.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className='space-y-4'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Featured Restaurants</h2>
            <p className='text-muted-foreground text-sm'>
              Public discovery preview from live data.
            </p>
          </div>
        </div>

        {restaurantsQuery.isPending ? (
          <Card>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-sm'>Loading restaurants...</p>
            </CardContent>
          </Card>
        ) : restaurants.length > 0 ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardHeader>
                  <CardTitle className='text-lg'>{restaurant.name}</CardTitle>
                  <CardDescription>{restaurant.address}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <p className='text-muted-foreground line-clamp-3 text-sm'>
                    {restaurant.description || 'No description yet.'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Added {new Date(restaurant.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-sm'>No restaurants are published yet.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className='bg-card rounded-2xl border p-6 md:p-8'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <h3 className='text-xl font-semibold tracking-tight'>
              Ready to run your next service?
            </h3>
            <p className='text-muted-foreground text-sm'>
              Open the workspace to access admin, cashier, and kiosk operations.
            </p>
          </div>
          <Button asChild>
            {session?.user ? (
              <Link to='/workspace'>Open Workspace</Link>
            ) : (
              <Link to='/sign-in'>Sign in to Start</Link>
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
