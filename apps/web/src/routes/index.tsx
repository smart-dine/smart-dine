import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { authClient } from '#/lib/auth-client';
import { getTodayOpeningHoursLabel } from '#/lib/opening-hours';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, CalendarClock, Clock3, MapPin, Phone, Search, Store } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/')({ component: App });

const PAGE_SIZE = 9;

function App() {
  const { data: session } = authClient.useSession();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);

  const restaurantListQuery = useMemo(
    () => ({
      search: searchTerm || undefined,
      offset,
      limit: PAGE_SIZE,
    }),
    [offset, searchTerm],
  );

  const restaurantsQuery = useQuery(restaurantsQueryOptions.list(restaurantListQuery));

  const restaurants = restaurantsQuery.data ?? [];
  const canGoPrevious = offset > 0 && !restaurantsQuery.isPending;
  const canGoNext = restaurants.length === PAGE_SIZE && !restaurantsQuery.isPending;

  return (
    <main className='container mx-auto flex flex-col gap-8 px-4 py-8 md:py-12'>
      <section className='bg-card relative overflow-hidden rounded-3xl border p-8 shadow-sm md:p-12'>
        <div className='from-primary/15 absolute top-12 -left-24 size-56 rounded-full bg-linear-to-br to-transparent blur-3xl' />
        <div className='bg-primary/10 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl' />

        <div className='relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end'>
          <div className='space-y-4'>
            <Badge variant='secondary'>Smart Dine Discover</Badge>
            <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>
              Find the right table at the right time.
            </h1>
            <p className='text-muted-foreground max-w-2xl text-base md:text-lg'>
              Explore restaurants, browse menus, check opening hours, and reserve your next dining
              experience in a few clicks.
            </p>

            <div className='flex flex-wrap gap-3'>
              <Button asChild>
                <a href='#restaurants'>Browse restaurants</a>
              </Button>

              {session?.user ? (
                <Button
                  asChild
                  variant='outline'
                >
                  <Link to='/workspace'>Open your workspace</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant='outline'
                >
                  <Link to='/sign-in'>Sign in to reserve</Link>
                </Button>
              )}
            </div>
          </div>

          <Card className='bg-background/90 border-dashed'>
            <CardHeader>
              <CardTitle className='inline-flex items-center gap-2 text-lg'>
                <Store className='text-primary size-5' />
                Customer-first booking flow
              </CardTitle>
              <CardDescription>
                Choose a restaurant, pick your date and time, then select your table on the floor
                plan.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <p className='text-muted-foreground inline-flex items-center gap-2'>
                <Search className='size-4' />
                Search and filter restaurants.
              </p>
              <p className='text-muted-foreground inline-flex items-center gap-2'>
                <Clock3 className='size-4' />
                Review working hours and menu availability.
              </p>
              <p className='text-muted-foreground inline-flex items-center gap-2'>
                <CalendarClock className='size-4' />
                Reserve by selecting an available table.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id='restaurants'
        className='space-y-4'
      >
        <div className='flex items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Restaurants</h2>
            <p className='text-muted-foreground text-sm'>
              Explore all published venues, then open details for menu, hours, and reservations.
            </p>
          </div>
        </div>

        <form
          className='flex flex-col gap-2 md:flex-row'
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setSearchTerm(searchInput.trim());
          }}
        >
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              className='pl-9'
              placeholder='Search by name, description, address, or phone'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <Button type='submit'>Search</Button>
        </form>

        {restaurantsQuery.isPending ? (
          <Card>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-sm'>Loading restaurants...</p>
            </CardContent>
          </Card>
        ) : restaurants.length > 0 ? (
          <div className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className='flex h-full flex-col'
              >
                <CardHeader className='space-y-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <CardTitle className='text-lg'>{restaurant.name}</CardTitle>
                    <Badge
                      variant='outline'
                      className='shrink-0'
                    >
                      <Clock3 className='mr-1 size-3.5' />
                      {getTodayOpeningHoursLabel(restaurant.openingHours)}
                    </Badge>
                  </div>
                  <CardDescription className='inline-flex items-center gap-1.5'>
                    <MapPin className='size-3.5' />
                    {restaurant.address}
                  </CardDescription>
                </CardHeader>

                <CardContent className='flex flex-1 flex-col gap-3'>
                  <p className='text-muted-foreground line-clamp-3 text-sm leading-6'>
                    {restaurant.description || 'No description available yet.'}
                  </p>

                  <p className='text-muted-foreground inline-flex items-center gap-1.5 text-xs'>
                    <Phone className='size-3.5' />
                    {restaurant.phone}
                  </p>

                  <div className='mt-auto flex flex-wrap gap-2 pt-2'>
                    <Button
                      asChild
                      size='sm'
                    >
                      <Link
                        to='/restaurants/$restaurantId'
                        params={{ restaurantId: restaurant.id }}
                      >
                        View details
                        <ArrowRight className='ml-1 size-4' />
                      </Link>
                    </Button>

                    {session?.user ? (
                      <Button
                        asChild
                        size='sm'
                        variant='outline'
                      >
                        <Link
                          to='/restaurants/$restaurantId/reservation'
                          params={{ restaurantId: restaurant.id }}
                        >
                          Reserve
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size='sm'
                        variant='outline'
                      >
                        <Link
                          to='/sign-in'
                          search={{
                            redirect: `/restaurants/${restaurant.id}/reservation`,
                          }}
                        >
                          Sign in to reserve
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='outline'
                disabled={!canGoPrevious}
                onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
              >
                Previous
              </Button>

              <Button
                variant='outline'
                disabled={!canGoNext}
                onClick={() => setOffset((current) => current + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-sm'>
                No restaurants matched your search. Try a broader keyword.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
