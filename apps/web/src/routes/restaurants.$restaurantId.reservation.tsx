import {
  createRestaurantReservation,
  reservationsQueryOptions,
} from '#/lib/api/reservations';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import type { ReservationAvailabilityQueryInput, RestaurantFloorTable } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { authClient } from '#/lib/auth-client';
import { formatDateTime } from '#/lib/formatters';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
import { Label } from '@smartdine/ui/components/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { CalendarClock, CheckCircle2, Clock3, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

const MAX_PARTY_SIZE = 20;

type PositionedTable = RestaurantFloorTable & {
  leftPercent: number;
  topPercent: number;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocalValue = (value: Date) =>
  `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}T${pad2(value.getHours())}:${pad2(value.getMinutes())}`;

const createDefaultReservationDateTimeValue = () => {
  const nextSlot = new Date();
  nextSlot.setMinutes(0, 0, 0);
  nextSlot.setHours(nextSlot.getHours() + 2);

  return toDateTimeLocalValue(nextSlot);
};

const toIsoDateTimeValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const toPositionedTables = (tables: RestaurantFloorTable[]): PositionedTable[] => {
  if (tables.length === 0) {
    return [];
  }

  const xCoordinates = tables.map((table) => Number(table.xCoordinate));
  const yCoordinates = tables.map((table) => Number(table.yCoordinate));

  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return tables.map((table) => ({
    ...table,
    leftPercent: ((Number(table.xCoordinate) - minX) / rangeX) * 82 + 9,
    topPercent: ((Number(table.yCoordinate) - minY) / rangeY) * 78 + 11,
  }));
};

export const Route = createFileRoute('/restaurants/$restaurantId/reservation')({
  component: RestaurantReservationPage,
});

function RestaurantReservationPage() {
  const { restaurantId } = Route.useParams();
  const sessionQuery = authClient.useSession();

  const restaurantQuery = useQuery(restaurantsQueryOptions.detail(restaurantId));
  const floorMapQuery = useQuery(restaurantsQueryOptions.floorMap(restaurantId));

  const [reservationTimeLocal, setReservationTimeLocal] = useState(
    createDefaultReservationDateTimeValue,
  );
  const [partySize, setPartySize] = useState('2');
  const [availabilityRequest, setAvailabilityRequest] = useState<ReservationAvailabilityQueryInput | null>(
    null,
  );
  const [selectedTableId, setSelectedTableId] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [createdReservationId, setCreatedReservationId] = useState<string | null>(null);

  const availabilityQuery = useQuery(
    reservationsQueryOptions.availability(
      restaurantId,
      availabilityRequest ?? {
        from: new Date(0).toISOString(),
        partySize: 1,
      },
      Boolean(availabilityRequest),
    ),
  );

  const availableTables = availabilityQuery.data?.availableTables ?? [];

  const sortedAvailableTables = useMemo(
    () => [...availableTables].sort((left, right) => left.tableNumber.localeCompare(right.tableNumber)),
    [availableTables],
  );

  const availableTableIds = useMemo(
    () => new Set(availableTables.map((table) => table.id)),
    [availableTables],
  );

  const positionedTables = useMemo(
    () => toPositionedTables(floorMapQuery.data?.tables ?? []),
    [floorMapQuery.data?.tables],
  );

  const createReservationMutation = useMutation({
    mutationFn: ({
      tableId,
      request,
    }: {
      tableId: string;
      request: ReservationAvailabilityQueryInput;
    }) =>
      createRestaurantReservation(restaurantId, {
        tableId,
        reservationTime: request.from,
        partySize: request.partySize,
      }),
    onSuccess: (reservation) => {
      setPageError(null);
      setCreatedReservationId(reservation.id);
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to create reservation.'));
    },
  });

  if (sessionQuery.isPending) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Checking session</CardTitle>
            <CardDescription>Preparing your reservation flow.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!sessionQuery.data?.user) {
    return (
      <Navigate
        to='/sign-in'
        search={{
          redirect: `/restaurants/${restaurantId}/reservation`,
        }}
        replace
      />
    );
  }

  if (restaurantQuery.isPending || floorMapQuery.isPending) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Loading reservation options</CardTitle>
            <CardDescription>Fetching restaurant details and table floor plan.</CardDescription>
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
            <CardTitle>Restaurant unavailable</CardTitle>
            <CardDescription>Unable to locate this restaurant.</CardDescription>
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

  return (
    <main className='container mx-auto flex flex-col gap-5 px-4 py-8'>
      <section className='space-y-2'>
        <p className='text-primary inline-flex items-center gap-2 text-sm font-medium'>
          <CalendarClock className='size-4' />
          Customer Reservation
        </p>
        <h1 className='text-3xl font-semibold tracking-tight'>Reserve at {restaurant.name}</h1>
        <p className='text-muted-foreground'>
          Select your date and time, then pick an available table directly from the floor plan.
        </p>
      </section>

      <section className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
        <Card>
          <CardHeader>
            <CardTitle className='inline-flex items-center gap-2'>
              <Clock3 className='size-4' />
              1. Choose date and time
            </CardTitle>
            <CardDescription>
              We will show table availability for your selected dining slot.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className='space-y-3'
              onSubmit={(event) => {
                event.preventDefault();

                const reservationTime = toIsoDateTimeValue(reservationTimeLocal);
                const parsedPartySize = Number(partySize);

                if (!reservationTime) {
                  setPageError('Please provide a valid reservation date and time.');
                  return;
                }

                if (!Number.isInteger(parsedPartySize) || parsedPartySize < 1) {
                  setPageError('Party size must be at least 1.');
                  return;
                }

                if (parsedPartySize > MAX_PARTY_SIZE) {
                  setPageError(`Party size cannot exceed ${MAX_PARTY_SIZE}.`);
                  return;
                }

                setPageError(null);
                setCreatedReservationId(null);
                setSelectedTableId('');
                setAvailabilityRequest({
                  from: reservationTime,
                  partySize: parsedPartySize,
                });
              }}
            >
              <div className='grid gap-2'>
                <Label htmlFor='reservation-time'>Date and time</Label>
                <Input
                  id='reservation-time'
                  type='datetime-local'
                  min={toDateTimeLocalValue(new Date())}
                  value={reservationTimeLocal}
                  onChange={(event) => setReservationTimeLocal(event.target.value)}
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='reservation-party-size'>Party size</Label>
                <Input
                  id='reservation-party-size'
                  type='number'
                  min='1'
                  max={String(MAX_PARTY_SIZE)}
                  value={partySize}
                  onChange={(event) => setPartySize(event.target.value)}
                  required
                />
              </div>

              <Button
                type='submit'
                disabled={availabilityQuery.isPending}
              >
                {availabilityQuery.isPending ? 'Checking availability...' : 'Check tables'}
              </Button>
            </form>

            {availabilityRequest && (
              <p className='text-muted-foreground mt-3 text-sm'>
                Requested: {formatDateTime(availabilityRequest.from)} for {availabilityRequest.partySize}{' '}
                guests.
              </p>
            )}

            {availabilityQuery.isError && (
              <p className='text-destructive mt-3 text-sm'>
                {getApiErrorMessage(availabilityQuery.error, 'Unable to load availability.')}
              </p>
            )}

            {pageError && <p className='text-destructive mt-3 text-sm'>{pageError}</p>}

            {createdReservationId && (
              <div className='mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm'>
                <p className='inline-flex items-center gap-2 font-medium text-emerald-700'>
                  <CheckCircle2 className='size-4' />
                  Reservation created successfully.
                </p>
                <p className='text-muted-foreground mt-1'>Reference: {createdReservationId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='inline-flex items-center gap-2'>
              <MapPin className='size-4' />
              2. Pick your table
            </CardTitle>
            <CardDescription>
              Select one available table on the floor plan to finalize your reservation.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            {!availabilityRequest ? (
              <p className='text-muted-foreground text-sm'>
                Choose a date, time, and party size to load table availability.
              </p>
            ) : availabilityQuery.isPending ? (
              <p className='text-muted-foreground text-sm'>Loading floor map availability...</p>
            ) : sortedAvailableTables.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                No available tables match this slot. Try another time or party size.
              </p>
            ) : (
              <>
                <div className='relative h-105 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top,rgba(79,184,178,0.16),transparent_42%)]'>
                  {positionedTables.map((table) => {
                    const isAvailable = availableTableIds.has(table.id);
                    const isSelected = selectedTableId === table.id;
                    const shapeClass = table.shape === 'round' ? 'h-14 w-14 rounded-full' : 'h-12 w-16 rounded-md';

                    return (
                      <button
                        key={table.id}
                        type='button'
                        className={
                          `${shapeClass} absolute border text-xs font-medium transition ` +
                          `${isAvailable ? 'cursor-pointer border-primary/40 bg-primary/10 text-foreground hover:border-primary hover:bg-primary/20' : 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-75'} ` +
                          `${isSelected ? 'ring-primary ring-2 ring-offset-2 ring-offset-background' : ''}`
                        }
                        style={{
                          left: `${table.leftPercent}%`,
                          top: `${table.topPercent}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        disabled={!isAvailable}
                        onClick={() => {
                          setPageError(null);
                          setSelectedTableId(table.id);
                        }}
                      >
                        {table.tableNumber}
                      </button>
                    );
                  })}
                </div>

                <div className='grid gap-2 sm:grid-cols-2'>
                  {sortedAvailableTables.map((table) => (
                    <Button
                      key={table.id}
                      variant={selectedTableId === table.id ? 'default' : 'outline'}
                      className='justify-between'
                      onClick={() => {
                        setPageError(null);
                        setSelectedTableId(table.id);
                      }}
                    >
                      <span>Table {table.tableNumber}</span>
                      <span className='text-xs opacity-80'>{table.capacity} seats</span>
                    </Button>
                  ))}
                </div>

                <Button
                  disabled={!selectedTableId || createReservationMutation.isPending}
                  onClick={() => {
                    if (!selectedTableId) {
                      setPageError('Choose a table before completing reservation.');
                      return;
                    }

                    createReservationMutation.mutate({
                      tableId: selectedTableId,
                      request: availabilityRequest,
                    });
                  }}
                >
                  {createReservationMutation.isPending ? 'Creating reservation...' : 'Reserve selected table'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
