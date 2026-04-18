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
import { ArrowLeft, CalendarClock, Clock3, MapPin, Phone } from 'lucide-react';

export const Route = createFileRoute('/restaurants/$restaurantId')({
  component: RestaurantDetailPage,
});

function RestaurantDetailPage() {
  const { restaurantId } = Route.useParams();
  const { data: session } = authClient.useSession();

  const restaurantQuery = useQuery(restaurantsQueryOptions.detail(restaurantId));

  if (restaurantQuery.isPending) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Loading restaurant</CardTitle>
            <CardDescription>Fetching menu, working hours, and venue details.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const restaurant = restaurantQuery.data;

  if (!restaurant) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Restaurant not found</CardTitle>
            <CardDescription>
              The restaurant you requested could not be located or is unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to='/'>Back to discovery</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const openingHoursRows = getOpeningHoursRows(restaurant.openingHours);

  return (
    <main className='container mx-auto flex flex-col gap-6 px-4 py-8'>
      <section className='flex flex-wrap items-center justify-between gap-3'>
        <Button
          asChild
          variant='ghost'
        >
          <Link to='/'>
            <ArrowLeft className='mr-1 size-4' />
            Back to restaurants
          </Link>
        </Button>

        {session?.user ? (
          <Button asChild>
            <Link
              to='/restaurants/$restaurantId/reservation'
              params={{ restaurantId }}
            >
              <CalendarClock className='mr-1 size-4' />
              Reserve a table
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link
              to='/sign-in'
              search={{
                redirect: `/restaurants/${restaurantId}/reservation`,
              }}
            >
              <CalendarClock className='mr-1 size-4' />
              Sign in to reserve
            </Link>
          </Button>
        )}
      </section>

      <section className='grid gap-4 lg:grid-cols-[1.35fr_0.65fr]'>
        <Card className='overflow-hidden'>
          {restaurant.images.length > 0 && (
            <img
              src={restaurant.images[0]}
              alt={`${restaurant.name} cover image`}
              className='h-72 w-full object-cover'
            />
          )}

          <CardHeader>
            <CardTitle className='text-3xl tracking-tight'>{restaurant.name}</CardTitle>
            <CardDescription className='text-base'>
              {restaurant.description || 'No description available for this restaurant yet.'}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>
                <Clock3 className='mr-1 size-3.5' />
                {getTodayOpeningHoursLabel(restaurant.openingHours)}
              </Badge>
              <Badge variant='outline'>
                <MapPin className='mr-1 size-3.5' />
                {restaurant.address}
              </Badge>
              <Badge variant='outline'>
                <Phone className='mr-1 size-3.5' />
                {restaurant.phone}
              </Badge>
            </div>

            {restaurant.images.length > 1 && (
              <div className='grid gap-3 sm:grid-cols-2'>
                {restaurant.images.slice(1).map((imageUrl, index) => (
                  <img
                    key={`${imageUrl}-${index}`}
                    src={imageUrl}
                    alt={`${restaurant.name} gallery image ${index + 2}`}
                    className='h-40 w-full rounded-xl border object-cover'
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working hours</CardTitle>
            <CardDescription>Plan your visit around the restaurant schedule.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {openingHoursRows.map((row) => (
              <div
                key={row.day}
                className='flex items-center justify-between rounded-md border px-3 py-2'
              >
                <span className='font-medium'>{row.label}</span>
                <span className={row.isClosed ? 'text-muted-foreground' : 'text-foreground'}>
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <CardDescription>Preview dishes and pricing before you reserve.</CardDescription>
          </CardHeader>
          <CardContent>
            {restaurant.menuItems.length > 0 ? (
              <div className='grid gap-3 md:grid-cols-2'>
                {restaurant.menuItems.map((menuItem) => (
                  <article
                    key={menuItem.id}
                    className='rounded-xl border p-4'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <h3 className='font-semibold'>{menuItem.name}</h3>
                        <p className='text-muted-foreground text-sm'>
                          {menuItem.description || 'No description provided.'}
                        </p>
                      </div>

                      <Badge variant={menuItem.isAvailable ? 'default' : 'secondary'}>
                        {menuItem.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    {menuItem.image && (
                      <img
                        src={menuItem.image}
                        alt={menuItem.name}
                        className='mt-3 h-36 w-full rounded-lg border object-cover'
                      />
                    )}

                    <p className='mt-3 text-sm font-medium'>{formatMoney(menuItem.price)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Menu items are not published for this restaurant yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
