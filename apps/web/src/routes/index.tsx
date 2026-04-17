import { staffQueryOptions } from '#/lib/api/staff';
import { authClient } from '#/lib/auth-client';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { LayoutDashboard, Store } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const membershipsQuery = useQuery({
    ...staffQueryOptions.myRestaurants(),
    enabled: Boolean(session?.user),
  });

  const memberships = membershipsQuery.data ?? [];

  return (
    <main className='container mx-auto flex flex-col gap-6 px-4 py-8'>
      <section className='relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm'>
        <div className='absolute -right-24 -bottom-20 size-64 rounded-full bg-primary/10 blur-3xl' />
        <div className='relative z-10 space-y-3'>
          <Badge variant='secondary'>Client SPA</Badge>
          <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>Smart Dine Frontend Hub</h1>
          <p className='text-muted-foreground max-w-2xl'>
            Access site administration, restaurant operations, and cashier order construction workflows.
          </p>

          <div className='flex flex-wrap gap-2'>
            <Button asChild>
              <Link to='/admin'>
                <LayoutDashboard className='mr-1 size-4' />
                Site Admin
              </Link>
            </Button>
            {!session?.user && (
              <Button
                asChild
                variant='outline'
              >
                <Link to='/sign-in'>Sign in to continue</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-2'>
        {sessionPending ? (
          <Card className='md:col-span-2'>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-sm'>Loading your workspace access...</p>
            </CardContent>
          </Card>
        ) : memberships.length > 0 ? (
          memberships.map((membership) => (
            <Card key={membership.id}>
              <CardHeader>
                <CardTitle className='inline-flex items-center gap-2 text-lg'>
                  <Store className='size-4' />
                  {membership.restaurant.name}
                </CardTitle>
                <CardDescription>{membership.restaurant.address}</CardDescription>
              </CardHeader>

              <CardContent className='space-y-3'>
                <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
                  {membership.role}
                </Badge>

                <div className='flex flex-wrap gap-2'>
                  <Button
                    asChild
                    variant='outline'
                  >
                    <Link
                      to='/restaurants/$restaurantId/admin'
                      params={{ restaurantId: membership.restaurantId }}
                    >
                      Restaurant Admin
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant='outline'
                  >
                    <Link
                      to='/restaurants/$restaurantId/cashier'
                      params={{ restaurantId: membership.restaurantId }}
                    >
                      Cashier
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className='md:col-span-2'>
            <CardHeader>
              <CardTitle>No Restaurant Assignments Yet</CardTitle>
              <CardDescription>
                Ask an owner or admin to assign you to a restaurant to access admin and cashier tools.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}
