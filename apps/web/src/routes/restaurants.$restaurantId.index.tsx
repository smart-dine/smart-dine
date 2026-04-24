import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { authClient } from '#/lib/auth-client';
import { formatMoney } from '#/lib/formatters';
import { getOpeningHoursRows, getTodayOpeningHoursLabel } from '#/lib/opening-hours';
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
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  MapPin,
  Phone,
  Store,
  Info,
  Loader2,
} from 'lucide-react';

export const Route = createFileRoute('/restaurants/$restaurantId/')({
  component: RestaurantDetailPage,
});

function RestaurantDetailPage() {
  const { restaurantId } = Route.useParams();
  const { data: session } = authClient.useSession();

  const restaurantQuery = useQuery(restaurantsQueryOptions.detail(restaurantId));

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (restaurantQuery.isPending) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center gap-4'>
        <Loader2 className='text-primary/50 size-10 animate-spin' />
        <div className='text-center'>
          <h2 className='text-xl font-semibold'>Loading venue details...</h2>
          <p className='text-muted-foreground'>Preparing the menu and schedule</p>
        </div>
      </main>
    );
  }

  const restaurant = restaurantQuery.data;

  // ---------------------------------------------------------------------------
  // NOT FOUND STATE
  // ---------------------------------------------------------------------------
  if (!restaurant) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center px-4'>
        <div className='flex max-w-md flex-col items-center gap-6 rounded-3xl border border-dashed p-10 text-center'>
          <div className='bg-muted flex size-16 items-center justify-center rounded-full'>
            <Store className='text-muted-foreground size-8' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold tracking-tight'>Restaurant not found</h1>
            <p className='text-muted-foreground'>
              The venue you requested could not be located or is currently unavailable.
            </p>
          </div>
          <Button
            asChild
            size='lg'
            className='mt-2 w-full'
          >
            <Link to='/'>Back to discovery</Link>
          </Button>
        </div>
      </main>
    );
  }

  const openingHoursRows = getOpeningHoursRows(restaurant.openingHours);

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------
  return (
    <main className='bg-background flex min-h-screen flex-col pb-24'>
      {/* Top Navigation Bar */}
      <div className='container mx-auto px-6 py-6'>
        <Button
          asChild
          variant='ghost'
          className='text-muted-foreground hover:text-foreground -ml-4'
        >
          <Link to='/'>
            <ArrowLeft className='mr-2 size-4' />
            Back to restaurants
          </Link>
        </Button>
      </div>

      {/* Typography-Forward Hero Section */}
      <section className='container mx-auto px-6'>
        <div className='border-border/50 from-primary/5 via-muted/30 to-background relative flex flex-col items-start justify-center overflow-hidden rounded-[2.5rem] border bg-gradient-to-br px-8 py-16 md:px-12 md:py-24 lg:px-16'>
          {/* Decorative ambient blurs */}
          <div className='bg-primary/10 absolute -top-20 -right-20 -z-10 size-72 rounded-full blur-3xl' />
          <div className='bg-primary/10 absolute -bottom-20 -left-20 -z-10 size-72 rounded-full blur-3xl' />

          <div className='relative z-10 flex max-w-3xl flex-col gap-6'>
            <div className='flex flex-wrap gap-3'>
              <Badge
                variant='secondary'
                className='px-3 py-1 text-sm'
              >
                <Clock3 className='mr-1.5 size-4' />
                {getTodayOpeningHoursLabel(restaurant.openingHours)}
              </Badge>
              <Badge
                variant='outline'
                className='bg-background/50 px-3 py-1 text-sm backdrop-blur-sm'
              >
                <MapPin className='mr-1.5 size-4' />
                {restaurant.address}
              </Badge>
            </div>

            <h1 className='text-foreground text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl'>
              {restaurant.name}
            </h1>

            <p className='text-muted-foreground text-lg leading-relaxed md:text-xl'>
              {restaurant.description ||
                'Welcome to our venue. Discover our menu, check our opening hours, and reserve your perfect table today.'}
            </p>
          </div>
        </div>
      </section>

      {/* Two-Column Layout */}
      <section className='container mx-auto mt-12 grid items-start gap-12 px-6 lg:grid-cols-12 lg:gap-16'>
        {/* LEFT COLUMN: Contact & Menu */}
        <div className='flex flex-col gap-12 lg:col-span-8'>
          {/* Quick Contact Bar */}
          <div className='border-border/50 bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-6 shadow-sm sm:gap-8'>
            <div className='text-muted-foreground flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
                <Phone className='text-primary size-5' />
              </div>
              <span className='text-foreground font-medium'>{restaurant.phone}</span>
            </div>
            <div className='bg-border/50 hidden h-8 w-px sm:block' />
            <div className='text-muted-foreground flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
                <MapPin className='text-primary size-5' />
              </div>
              <span className='text-foreground font-medium'>{restaurant.address}</span>
            </div>
          </div>

          {/* Menu Section */}
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <h2 className='text-3xl font-bold tracking-tight'>Menu</h2>
              <p className='text-muted-foreground'>Discover our culinary offerings.</p>
            </div>

            {restaurant.menuItems.length > 0 ? (
              <div className='flex flex-col gap-8'>
                {restaurant.menuItems.map((menuItem, index) => (
                  <div key={menuItem.id}>
                    <article className='flex flex-col gap-2'>
                      <div className='flex items-center justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                          <h3 className='text-lg font-semibold'>{menuItem.name}</h3>
                          {!menuItem.isAvailable && (
                            <Badge
                              variant='secondary'
                              className='text-xs'
                            >
                              Sold Out
                            </Badge>
                          )}
                        </div>
                        <div className='border-border/50 h-px flex-1 border-b border-dashed' />
                        <p className='text-foreground font-medium'>{formatMoney(menuItem.price)}</p>
                      </div>

                      <p className='text-muted-foreground max-w-2xl leading-relaxed'>
                        {menuItem.description || 'No description provided.'}
                      </p>
                    </article>

                    {index !== restaurant.menuItems.length - 1 && (
                      <div className='bg-border/50 mt-8 h-px w-full' />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='bg-muted/20 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-16 text-center'>
                <Info className='text-muted-foreground/50 size-8' />
                <p className='font-medium'>Menu coming soon</p>
                <p className='text-muted-foreground text-sm'>
                  This venue hasn't published their dishes yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebar */}
        <div className='lg:col-span-4'>
          <div className='sticky top-8 flex flex-col gap-6'>
            {/* Reservation CTA Card */}
            <Card className='border-primary/20 shadow-primary/5 overflow-hidden shadow-xl'>
              <div className='from-primary to-primary/60 h-2 w-full bg-gradient-to-r' />
              <CardHeader>
                <CardTitle className='text-2xl'>Reserve a Table</CardTitle>
                <CardDescription>Secure your spot instantly through Smart Dine.</CardDescription>
              </CardHeader>
              <CardContent>
                {session?.user ? (
                  <Button
                    asChild
                    size='lg'
                    className='w-full text-base font-semibold shadow-md'
                  >
                    <Link
                      to='/restaurants/$restaurantId/reservation'
                      params={{ restaurantId }}
                    >
                      <CalendarClock className='mr-2 size-5' />
                      Book Now
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size='lg'
                    className='w-full text-base font-semibold shadow-md'
                  >
                    <Link
                      to='/sign-in'
                      search={{ redirect: `/restaurants/${restaurantId}/reservation` }}
                    >
                      <CalendarClock className='mr-2 size-5' />
                      Sign in to reserve
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Working Hours Card */}
            <Card className='border-border/50 bg-muted/10'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Clock3 className='text-primary size-5' />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-1.5 text-sm'>
                {openingHoursRows.map((row) => (
                  <div
                    key={row.day}
                    className={`flex items-center justify-between rounded-lg p-2.5 transition-colors ${
                      row.label === 'Today'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span>{row.label}</span>
                    <span
                      className={row.isClosed ? 'text-muted-foreground font-normal' : 'font-medium'}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
