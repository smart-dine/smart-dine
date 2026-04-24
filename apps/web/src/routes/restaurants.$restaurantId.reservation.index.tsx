import { createRestaurantReservation, reservationsQueryOptions } from '#/lib/api/reservations';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import type { ReservationAvailabilityQueryInput, RestaurantFloorTable } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { authClient } from '#/lib/auth-client';
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
import { Badge } from '@smartdine/ui/components/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  Lock,
  MoveHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const MAX_PARTY_SIZE = 20;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

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
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toPositionedTables = (tables: RestaurantFloorTable[]): PositionedTable[] => {
  if (tables.length === 0) return [];

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

const getTableDimensions = (table: PositionedTable, maxCapacity: number, isMobile: boolean) => {
  const minSize = isMobile ? 40 : 56;
  const maxSize = isMobile ? 64 : 96;
  const scale = maxCapacity > 1 ? (table.capacity - 1) / (maxCapacity - 1) : 0;
  const baseSize = minSize + scale * (maxSize - minSize);

  if (table.shape === 'round') {
    return {
      width: baseSize,
      height: baseSize,
    };
  }

  return {
    width: Math.min(Math.max(baseSize * 1.2, isMobile ? 56 : 72), isMobile ? 80 : 120),
    height: Math.min(Math.max(baseSize * 0.8, isMobile ? 40 : 56), isMobile ? 64 : 88),
  };
};

export const Route = createFileRoute('/restaurants/$restaurantId/reservation/')({
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
  const [availabilityRequest, setAvailabilityRequest] =
    useState<ReservationAvailabilityQueryInput | null>(null);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [createdReservationId, setCreatedReservationId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const availabilityLookup =
    availabilityRequest ??
    ({
      from: new Date(0).toISOString(),
      partySize: 1,
    } satisfies ReservationAvailabilityQueryInput);

  const availabilityQuery = useQuery(
    reservationsQueryOptions.availability(
      restaurantId,
      availabilityLookup,
      availabilityRequest !== null,
    ),
  );

  const isCheckingAvailability =
    availabilityRequest !== null && availabilityQuery.fetchStatus === 'fetching';

  const availableTables = availabilityQuery.data?.availableTables ?? [];

  const sortedAvailableTables = useMemo(
    () =>
      [...availableTables].sort((left, right) => left.tableNumber.localeCompare(right.tableNumber)),
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

  const maxTableCapacity = useMemo(
    () => Math.max(...positionedTables.map((table) => table.capacity), 1),
    [positionedTables],
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

  if (sessionQuery.isPending || restaurantQuery.isPending || floorMapQuery.isPending) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center gap-4'>
        <Loader2 className='text-primary/50 size-10 animate-spin' />
        <div className='text-center'>
          <h2 className='text-xl font-semibold'>Preparing Booking Experience</h2>
          <p className='text-muted-foreground'>Loading floor plans and availability...</p>
        </div>
      </main>
    );
  }

  if (!sessionQuery.data?.user) {
    return (
      <Navigate
        to='/sign-in'
        search={{ redirect: `/restaurants/${restaurantId}/reservation` }}
        replace
      />
    );
  }

  const restaurant = restaurantQuery.data;

  if (!restaurant) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center px-4'>
        <div className='flex max-w-md flex-col items-center gap-6 rounded-3xl border border-dashed p-10 text-center'>
          <AlertCircle className='text-muted-foreground size-12' />
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold tracking-tight'>Restaurant unavailable</h1>
            <p className='text-muted-foreground'>Unable to locate this restaurant for booking.</p>
          </div>
          <Button
            asChild
            size='lg'
            className='mt-2 w-full'
          >
            <Link to='/'>Return to Search</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className='bg-background flex min-h-screen w-full flex-col overflow-x-hidden pb-24'>
      {/* Header Section */}
      <section className='from-primary/5 via-muted/30 to-background border-b bg-gradient-to-br py-10 md:py-16'>
        <div className='container mx-auto max-w-6xl px-4 md:px-6'>
          <div className='flex flex-col items-start gap-4'>
            <Badge
              variant='secondary'
              className='px-3 py-1 font-medium'
            >
              <CalendarClock className='mr-1.5 size-4' />
              Live Booking
            </Badge>
            <h1 className='text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl'>
              Reserve at <span className='text-primary'>{restaurant.name}</span>
            </h1>
            <p className='text-muted-foreground max-w-2xl text-base md:text-lg'>
              Select your preferred date and time, then pick an available table directly from the
              interactive floor plan.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Grid Layout */}
      <section className='container mx-auto max-w-6xl px-4 pt-8 md:px-6 md:pt-12'>
        <div className='grid w-full items-start gap-8 lg:grid-cols-12 lg:gap-12'>
          {/* LEFT COLUMN - STEP 1 (Search Form) 
              Added min-w-0 to prevent grid blowout!
          */}
          <div className='flex min-w-0 flex-col gap-6 lg:col-span-4'>
            {createdReservationId && (
              <Card className='overflow-hidden border-emerald-500/30 bg-emerald-50 shadow-sm dark:bg-emerald-500/10'>
                <div className='h-1.5 w-full bg-emerald-500' />
                <CardContent className='flex flex-col gap-4 p-5 md:p-6'>
                  <div className='flex items-center gap-3 text-emerald-700 dark:text-emerald-400'>
                    <CheckCircle2 className='size-8 shrink-0' />
                    <div>
                      <h3 className='text-lg font-bold'>Confirmed!</h3>
                      <p className='text-sm opacity-90'>Your table is locked in.</p>
                    </div>
                  </div>
                  <div className='rounded-lg bg-emerald-100/50 p-3 text-sm font-medium break-all text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'>
                    Ref: {createdReservationId}
                  </div>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full border-emerald-500/20 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                  >
                    <Link to='/'>Return to Home</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className='border-border/50 shadow-sm'>
              <CardHeader className='bg-muted/20 border-b p-5 pb-4 md:p-6'>
                <CardTitle className='flex items-center gap-2 text-xl'>
                  <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-base'>
                    1
                  </div>
                  Find a Time
                </CardTitle>
              </CardHeader>

              <CardContent className='p-5 md:p-6'>
                <form
                  className='flex flex-col gap-5'
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
                  <div className='space-y-2.5'>
                    <Label
                      htmlFor='reservation-time'
                      className='flex items-center gap-2 text-sm font-semibold'
                    >
                      <Calendar className='text-muted-foreground size-4' />
                      Date & Time
                    </Label>
                    <Input
                      id='reservation-time'
                      type='datetime-local'
                      className='h-12 w-full text-base'
                      min={toDateTimeLocalValue(new Date())}
                      value={reservationTimeLocal}
                      onChange={(event) => setReservationTimeLocal(event.target.value)}
                      required
                    />
                  </div>

                  <div className='space-y-2.5'>
                    <Label
                      htmlFor='reservation-party-size'
                      className='flex items-center gap-2 text-sm font-semibold'
                    >
                      <Users className='text-muted-foreground size-4' />
                      Party Size
                    </Label>
                    <Input
                      id='reservation-party-size'
                      type='number'
                      className='h-12 w-full text-base'
                      min='1'
                      max={String(MAX_PARTY_SIZE)}
                      value={partySize}
                      onChange={(event) => setPartySize(event.target.value)}
                      required
                    />
                  </div>

                  {pageError && (
                    <div className='bg-destructive/10 text-destructive rounded-lg p-3 text-sm font-medium'>
                      {pageError}
                    </div>
                  )}

                  <Button
                    type='submit'
                    size='lg'
                    className='mt-2 h-14 w-full text-base shadow-md'
                    disabled={isCheckingAvailability || !!createdReservationId}
                  >
                    {isCheckingAvailability ? (
                      <Loader2 className='mr-2 size-5 animate-spin' />
                    ) : (
                      'Check Availability'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - STEP 2 (Floor Plan Map) 
              Added min-w-0 to prevent grid blowout!
          */}
          <div className='flex min-w-0 flex-col gap-6 lg:col-span-8'>
            <Card className='border-border/50 flex h-full w-full flex-col overflow-hidden shadow-sm'>
              <CardHeader className='bg-muted/20 flex flex-col justify-between gap-4 border-b p-5 pb-4 sm:flex-row sm:items-center md:p-6'>
                <div className='space-y-1.5'>
                  <CardTitle className='flex items-center gap-2 text-xl'>
                    <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-base'>
                      2
                    </div>
                    Select your Table
                  </CardTitle>
                  <CardDescription>
                    Tap to select an available table on the blueprint.
                  </CardDescription>
                </div>

                {availabilityRequest && sortedAvailableTables.length > 0 && (
                  <div className='bg-background/80 flex flex-wrap items-center gap-3 rounded-lg border p-2 text-xs font-medium backdrop-blur-sm'>
                    <div className='flex items-center gap-1.5'>
                      <div className='bg-card border-border size-3 rounded-full border shadow-sm' />
                      <span className='text-foreground'>Available</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <div className='bg-primary ring-primary/20 size-3 rounded-full ring-2' />
                      <span className='text-foreground'>Selected</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <div className='bg-muted/80 flex size-3 items-center justify-center rounded-full'>
                        <Lock className='text-muted-foreground size-2' />
                      </div>
                      <span className='text-muted-foreground'>Taken</span>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className='bg-muted/5 flex w-full grow flex-col space-y-6 p-4 md:p-6'>
                {!availabilityRequest ? (
                  <div className='text-muted-foreground bg-background flex w-full grow flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-16 text-center'>
                    <MapPin className='mb-4 size-10 opacity-20' />
                    <p className='max-w-xs'>
                      Enter your details on the left to reveal the floor plan.
                    </p>
                  </div>
                ) : isCheckingAvailability ? (
                  <div className='text-muted-foreground bg-background flex w-full grow flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center'>
                    <Loader2 className='mb-4 size-10 animate-spin opacity-50' />
                    <p>Scanning tables...</p>
                  </div>
                ) : sortedAvailableTables.length === 0 ? (
                  <div className='bg-background flex w-full grow flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-16 text-center'>
                    <AlertCircle className='text-muted-foreground/50 mb-4 size-10' />
                    <p className='text-foreground font-medium'>No tables available</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Try selecting a different time or party size.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className='bg-card group relative w-full overflow-hidden rounded-3xl border shadow-inner'>
                      <div className='bg-background/80 pointer-events-none absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1.5 opacity-80 shadow-sm backdrop-blur-md lg:hidden'>
                        <MoveHorizontal className='text-muted-foreground size-3.5' />
                        <span className='text-foreground text-xs font-medium'>Pan to explore</span>
                      </div>

                      {/* Map Container. Overflow-x-auto allows horizontal scrolling 
                          without blowing out the grid because of min-w-0 on the parent. */}
                      <div className='scrollbar-hide w-full overflow-x-auto overflow-y-hidden'>
                        <div
                          className='relative h-[450px] w-full min-w-[650px] md:h-[550px]'
                          style={{
                            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
                            backgroundSize: '24px 24px',
                          }}
                        >
                          {positionedTables.map((table) => {
                            const isAvailable = availableTableIds.has(table.id);
                            const isSelected = selectedTableId === table.id;
                            const dimensions = getTableDimensions(
                              table,
                              maxTableCapacity,
                              isMobile,
                            );

                            return (
                              <button
                                key={table.id}
                                type='button'
                                className={
                                  `absolute flex flex-col items-center justify-center gap-0.5 border-2 text-center shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none ` +
                                  `${table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'} ` +
                                  `${isAvailable && !isSelected ? 'border-border/60 bg-card text-foreground hover:border-primary/50 cursor-pointer hover:scale-105 hover:shadow-md' : ''} ` +
                                  `${!isAvailable ? 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed border-transparent' : ''} ` +
                                  `${isSelected ? 'ring-primary/20 border-primary bg-primary text-primary-foreground z-20 scale-110 shadow-xl ring-4' : 'z-10'}`
                                }
                                style={{
                                  left: `${table.leftPercent}%`,
                                  top: `${table.topPercent}%`,
                                  transform: 'translate(-50%, -50%)',
                                  width: `${dimensions.width}px`,
                                  height: `${dimensions.height}px`,
                                }}
                                disabled={!isAvailable || !!createdReservationId}
                                onClick={() => {
                                  setPageError(null);
                                  setSelectedTableId(table.id);
                                }}
                              >
                                <span className='block truncate text-sm leading-none font-bold'>
                                  {table.tableNumber}
                                </span>
                                <span
                                  className={`flex items-center text-[11px] leading-none font-medium ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                                >
                                  {table.capacity} <Users className='ml-0.5 size-2.5' />
                                </span>

                                {!isAvailable && (
                                  <div className='bg-background/10 rounded-inherit pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-[1px]'>
                                    <Lock className='size-3.5 opacity-40' />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className='flex w-full flex-col gap-5 pt-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-foreground text-sm font-semibold'>
                          Or pick from list ({sortedAvailableTables.length})
                        </Label>
                      </div>

                      {/* Using min-w-0 / w-full to ensure carousel doesn't push bounds */}
                      <div className='scrollbar-hide flex w-full snap-x gap-3 overflow-x-auto pb-4'>
                        {sortedAvailableTables.map((table) => {
                          const isSelected = selectedTableId === table.id;
                          return (
                            <button
                              key={table.id}
                              type='button'
                              className={`flex w-[140px] shrink-0 snap-start flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                                  : 'bg-card hover:border-primary/40 hover:bg-muted/30'
                              }`}
                              onClick={() => {
                                setPageError(null);
                                setSelectedTableId(table.id);
                              }}
                              disabled={!!createdReservationId}
                            >
                              <span
                                className={`text-sm font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}
                              >
                                Table {table.tableNumber}
                              </span>
                              <span
                                className={`mt-1 flex items-center gap-1.5 text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                              >
                                <Users className='size-3.5' /> {table.capacity} seats
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className='border-t pt-2'>
                        <Button
                          size='lg'
                          className={`mt-2 h-14 w-full text-base font-bold transition-all ${selectedTableId && !createdReservationId ? 'scale-[1.01] shadow-xl' : ''}`}
                          disabled={
                            !selectedTableId ||
                            createReservationMutation.isPending ||
                            !!createdReservationId
                          }
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
                          {createReservationMutation.isPending
                            ? 'Locking in your table...'
                            : selectedTableId
                              ? 'Confirm Reservation'
                              : 'Select a table to continue'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
