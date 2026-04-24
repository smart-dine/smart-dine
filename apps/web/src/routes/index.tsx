import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { staffQueryOptions } from '#/lib/api/staff';
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
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  MapPin,
  Phone,
  Search,
  Store,
  Mail,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/')({ component: App });

const PAGE_SIZE = 9;

function App() {
  const { data: session } = authClient.useSession();
  const userRole = session?.user.role;
  const isAuthenticated = Boolean(session?.user);

  const membershipsQuery = useQuery({
    ...staffQueryOptions.myRestaurants(),
    enabled: isAuthenticated,
  });

  const canAccessWorkspace =
    userRole === 'admin' || ((membershipsQuery.data?.length ?? 0) > 0 && isAuthenticated);

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
    <main className='bg-background flex min-h-screen w-full flex-col'>
      {/* HERO SECTION */}
      <section className='bg-muted/20 relative overflow-hidden border-b px-6 py-24 md:py-32 lg:py-40'>
        {/* Background Decorative Gradients */}
        <div className='from-primary/15 via-background to-background absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]' />

        <div className='container mx-auto grid gap-16 lg:grid-cols-2 lg:items-center'>
          {/* Hero Text Content */}
          <div className='flex flex-col items-start gap-8'>
            <Badge
              variant='secondary'
              className='px-4 py-1.5 text-sm font-medium'
            >
              Smart Dine Discover
            </Badge>

            <h1 className='text-foreground text-5xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl'>
              Find the <span className='text-primary'>right table</span> at the right time.
            </h1>

            <p className='text-muted-foreground max-w-xl text-lg leading-relaxed text-balance sm:text-xl'>
              Explore restaurants, browse menus, check opening hours, and reserve your next dining
              experience in just a few clicks.
            </p>

            <div className='flex flex-wrap items-center gap-4 pt-4'>
              <Button
                asChild
                size='lg'
                className='h-12 px-8 text-base shadow-lg'
              >
                <a href='#restaurants'>Browse restaurants</a>
              </Button>

              {!session?.user ? (
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='bg-background h-12 px-8 text-base'
                >
                  <Link to='/sign-in'>Sign in to reserve</Link>
                </Button>
              ) : canAccessWorkspace ? (
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='bg-background h-12 px-8 text-base'
                >
                  <Link to='/workspace'>Open your workspace</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className='relative mx-auto w-full max-w-md lg:mr-0 lg:ml-auto'>
            <div className='from-primary/30 absolute -inset-1 rounded-3xl bg-gradient-to-br to-transparent blur-2xl' />
            <Card className='border-border/50 bg-background/95 relative shadow-2xl backdrop-blur-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-3 text-xl'>
                  <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                    <Store className='text-primary size-5' />
                  </div>
                  Customer-first booking
                </CardTitle>
                <CardDescription className='text-base'>
                  Choose a restaurant, pick your date and time, then select your exact table on the
                  floor plan.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='bg-muted/50 flex items-center gap-4 rounded-lg p-4'>
                  <Search className='text-primary size-5' />
                  <span className='text-foreground text-sm font-medium'>
                    Search and filter restaurants
                  </span>
                </div>
                <div className='bg-muted/50 flex items-center gap-4 rounded-lg p-4'>
                  <Clock3 className='text-primary size-5' />
                  <span className='text-foreground text-sm font-medium'>
                    Review hours and availability
                  </span>
                </div>
                <div className='bg-muted/50 flex items-center gap-4 rounded-lg p-4'>
                  <CalendarClock className='text-primary size-5' />
                  <span className='text-foreground text-sm font-medium'>
                    Reserve your perfect table
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* DISCOVER SECTION (Search & Grid) */}
      <section
        id='restaurants'
        className='container mx-auto flex flex-col gap-12 px-6 py-24'
      >
        {/* Section Header & Search Form */}
        <div className='border-border/50 bg-card flex flex-col gap-8 rounded-3xl border p-8 shadow-sm md:flex-row md:items-end md:justify-between md:p-10'>
          <div className='flex max-w-xl flex-col gap-2'>
            <h2 className='text-foreground text-3xl font-bold tracking-tight'>
              Explore Restaurants
            </h2>
            <p className='text-muted-foreground text-lg'>
              Find your next favorite spot. Search all published venues and view their menus, hours,
              and reservations.
            </p>
          </div>

          <form
            className='flex w-full max-w-md flex-col gap-3 sm:flex-row'
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setSearchTerm(searchInput.trim());
            }}
          >
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2' />
              <Input
                className='h-12 w-full rounded-xl pl-11 text-base'
                placeholder='Search name, address, or phone...'
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <Button
              type='submit'
              size='lg'
              className='h-12 rounded-xl'
            >
              Search
            </Button>
          </form>
        </div>

        {/* Results Area */}
        <div className='flex flex-col gap-8'>
          {restaurantsQuery.isPending ? (
            <div className='flex min-h-[400px] w-full items-center justify-center rounded-3xl border border-dashed'>
              <p className='text-muted-foreground text-lg font-medium'>Loading amazing places...</p>
            </div>
          ) : restaurants.length > 0 ? (
            <>
              {/* Grid Layout */}
              <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
                {restaurants.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    className='group hover:border-primary/40 flex h-full flex-col overflow-hidden transition-all hover:shadow-md'
                  >
                    <CardHeader className='bg-muted/20 gap-4 border-b pb-6'>
                      <div className='flex flex-col items-start justify-between gap-4 md:flex-row'>
                        <CardTitle className='text-foreground group-hover:text-primary text-xl leading-tight transition-colors'>
                          {restaurant.name}
                        </CardTitle>
                        <Badge
                          variant='outline'
                          className='bg-background shrink-0 py-1'
                        >
                          <Clock3 className='text-primary mr-1.5 size-3.5' />
                          {getTodayOpeningHoursLabel(restaurant.openingHours)}
                        </Badge>
                      </div>
                      <CardDescription className='flex items-start gap-2 text-sm'>
                        <MapPin className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                        <span className='leading-relaxed'>{restaurant.address}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className='flex flex-1 flex-col gap-6 pt-6'>
                      <p className='text-muted-foreground line-clamp-3 flex-1 text-sm leading-relaxed'>
                        {restaurant.description ||
                          'No description available yet. Check back soon for more details.'}
                      </p>

                      <div className='text-foreground flex items-center gap-2 text-sm font-medium'>
                        <Phone className='text-primary size-4' />
                        {restaurant.phone}
                      </div>

                      {/* Action Buttons forced to bottom */}
                      <div className='mt-auto flex flex-col gap-3 pt-2 sm:flex-row'>
                        <Button
                          asChild
                          variant='secondary'
                          className='w-full sm:flex-1'
                        >
                          <Link
                            to='/restaurants/$restaurantId'
                            params={{ restaurantId: restaurant.id }}
                          >
                            View details
                          </Link>
                        </Button>

                        {session?.user ? (
                          <Button
                            asChild
                            className='w-full sm:flex-1'
                          >
                            <Link
                              to='/restaurants/$restaurantId/reservation'
                              params={{ restaurantId: restaurant.id }}
                            >
                              Reserve Table
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className='w-full sm:flex-1'
                          >
                            <Link
                              to='/sign-in'
                              search={{ redirect: `/restaurants/${restaurant.id}/reservation` }}
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

              {/* Pagination */}
              <div className='mt-4 flex items-center justify-between border-t pt-8'>
                <p className='text-muted-foreground text-sm'>
                  Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, offset + restaurants.length)}{' '}
                  results
                </p>
                <div className='flex gap-3'>
                  <Button
                    variant='outline'
                    size='lg'
                    disabled={!canGoPrevious}
                    onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    disabled={!canGoNext}
                    onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className='flex min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed text-center'>
              <Search className='text-muted-foreground/50 size-12' />
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>No restaurants found</h3>
                <p className='text-muted-foreground'>
                  Try adjusting your search to find what you're looking for.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEW CONTACT CTA SECTION */}
      <section className='bg-primary/5 border-t px-6 py-24'>
        <div className='container mx-auto max-w-4xl'>
          <Card className='border-primary/20 bg-background overflow-hidden shadow-xl'>
            <div className='from-primary to-primary/60 h-2 w-full bg-gradient-to-r' />
            <CardContent className='flex flex-col items-center gap-8 p-10 text-center md:p-16'>
              <div className='bg-primary/10 flex size-20 items-center justify-center rounded-full'>
                <Store className='text-primary size-10' />
              </div>

              <div className='space-y-4'>
                <h2 className='text-foreground text-3xl font-bold tracking-tight md:text-5xl'>
                  Own a Restaurant?
                </h2>
                <p className='text-muted-foreground mx-auto max-w-2xl text-lg md:text-xl'>
                  Join the Smart Dine network. Streamline your reservations, manage your floor plans
                  dynamically, and let thousands of local diners discover your venue.
                </p>
              </div>

              <Button
                asChild
                size='lg'
                className='h-14 px-8 text-sm shadow-md transition-all hover:scale-105 md:text-lg'
              >
                <Link to='/contact'>
                  <Mail className='mr-2 size-5' />
                  Get in Touch to Partner
                  <ArrowRight className='ml-2 size-5' />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
