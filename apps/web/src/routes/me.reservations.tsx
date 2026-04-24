import type { MyReservation } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { queryKeys } from '#/lib/api/query-keys';
import { cancelReservation, reservationsQueryOptions } from '#/lib/api/reservations';
import { authClient } from '#/lib/auth-client';
import { formatDateTime } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader } from '@smartdine/ui/components/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import {
  CalendarClock,
  Clock3,
  MapPin,
  Table2,
  Loader2,
  Utensils,
  History,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

const isPastReservation = (reservation: MyReservation) =>
  new Date(reservation.reservationEndTime).getTime() < Date.now();

const isTerminalReservationStatus = (status: MyReservation['status']) =>
  status === 'completed' || status === 'cancelled';

const isOldReservation = (reservation: MyReservation) =>
  isPastReservation(reservation) || isTerminalReservationStatus(reservation.status);

const getStatusBadgeVariant = (status: MyReservation['status']) => {
  if (status === 'confirmed') return 'default';
  if (status === 'cancelled') return 'destructive';
  if (status === 'completed') return 'outline';
  return 'secondary';
};

export const Route = createFileRoute('/me/reservations')({
  component: MyReservationsPage,
});

function MyReservationsPage() {
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [pageError, setPageError] = useState<string | null>(null);
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null);

  const reservationsQuery = useQuery(
    reservationsQueryOptions.myReservations(Boolean(session?.user)),
  );

  const cancelMutation = useMutation({
    mutationFn: cancelReservation,
    onMutate: (reservationId: string) => {
      setCancelingReservationId(reservationId);
    },
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.me.reservations(),
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to cancel reservation.'));
    },
    onSettled: () => {
      setCancelingReservationId(null);
    },
  });

  // ---------------------------------------------------------------------------
  // LOADING & AUTH STATES
  // ---------------------------------------------------------------------------
  if (sessionPending || (session?.user && reservationsQuery.isPending)) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center gap-4'>
        <Loader2 className='text-primary/50 size-10 animate-spin' />
        <div className='text-center'>
          <h2 className='text-xl font-semibold'>Loading your itinerary...</h2>
          <p className='text-muted-foreground'>Fetching your reservation details</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <Navigate
        to='/sign-in'
        search={{ redirect: '/me/reservations' }}
        replace
      />
    );
  }

  const reservations = reservationsQuery.data ?? [];

  // Categorize reservations for better UX
  const upcomingReservations = reservations.filter((r) => !isOldReservation(r));
  const pastReservations = reservations.filter((r) => isOldReservation(r));

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------
  return (
    <main className='bg-background flex min-h-screen w-full flex-col pb-24'>
      {/* Header Section */}
      <section className='from-primary/5 via-muted/30 to-background border-b bg-gradient-to-br py-10 md:py-16'>
        <div className='container mx-auto max-w-6xl px-6'>
          <div className='flex flex-col items-start gap-4'>
            <Badge
              variant='secondary'
              className='px-3 py-1 font-medium'
            >
              <CalendarClock className='mr-1.5 size-4' />
              My Calendar
            </Badge>
            <h1 className='text-3xl font-extrabold tracking-tight md:text-5xl'>
              Your Reservations
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Manage your upcoming dining plans or review your past restaurant visits.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className='container mx-auto max-w-6xl px-6 pt-10'>
        {pageError && (
          <div className='bg-destructive/10 text-destructive border-destructive/20 mb-8 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium'>
            <AlertCircle className='size-5 shrink-0' />
            {pageError}
          </div>
        )}

        {reservations.length === 0 ? (
          /* Empty State */
          <div className='bg-muted/10 flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed px-4 py-24 text-center'>
            <div className='bg-primary/10 flex size-20 items-center justify-center rounded-full'>
              <Utensils className='text-primary size-10' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold tracking-tight'>No reservations yet</h2>
              <p className='text-muted-foreground max-w-md'>
                You don't have any upcoming or past reservations. Discover amazing restaurants and
                book your first table!
              </p>
            </div>
            <Button
              asChild
              size='lg'
              className='mt-4 h-12 shadow-md'
            >
              <Link to='/'>Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-16'>
            {/* UPCOMING RESERVATIONS */}
            {upcomingReservations.length > 0 && (
              <div className='flex flex-col gap-6'>
                <h2 className='text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight'>
                  <CalendarClock className='text-primary size-6' />
                  Upcoming
                </h2>

                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {upcomingReservations.map((reservation) => {
                    const cancelInProgress =
                      cancelMutation.isPending && cancelingReservationId === reservation.id;

                    return (
                      <Card
                        key={reservation.id}
                        className='border-primary/20 flex flex-col overflow-hidden shadow-md transition-all hover:shadow-lg'
                      >
                        <div className='from-primary to-primary/60 h-2 w-full bg-gradient-to-r' />

                        <CardHeader className='bg-muted/10 border-b pb-4'>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='space-y-1.5'>
                              <h3 className='text-xl leading-tight font-bold'>
                                {reservation.restaurant.name}
                              </h3>
                              <Badge
                                variant={getStatusBadgeVariant(reservation.status)}
                                className={
                                  reservation.status === 'confirmed'
                                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : ''
                                }
                              >
                                {reservation.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className='flex flex-1 flex-col gap-4 p-5'>
                          <div className='text-foreground flex items-center gap-3 font-medium'>
                            <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full'>
                              <Clock3 className='size-4' />
                            </div>
                            <span className='text-sm sm:text-base'>
                              {formatDateTime(reservation.reservationTime)}
                            </span>
                          </div>

                          <div className='text-muted-foreground flex items-center gap-3'>
                            <div className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-full'>
                              <MapPin className='size-4' />
                            </div>
                            <span className='text-sm leading-snug'>
                              {reservation.restaurant.address}
                            </span>
                          </div>

                          <div className='text-muted-foreground flex items-center gap-3'>
                            <div className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-full'>
                              <Table2 className='size-4' />
                            </div>
                            <span className='text-sm leading-snug'>
                              Table {reservation.table.tableNumber} <span className='mx-1'>·</span>{' '}
                              Party of {reservation.partySize}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className='mt-auto p-5 pt-0'>
                          <Button
                            variant='outline'
                            className='border-destructive/30 text-destructive hover:bg-destructive/10 w-full'
                            disabled={cancelMutation.isPending || !!cancelingReservationId}
                            onClick={() => cancelMutation.mutate(reservation.id)}
                          >
                            {cancelInProgress ? (
                              <>
                                <Loader2 className='mr-2 size-4 animate-spin' /> Cancelling...
                              </>
                            ) : (
                              'Cancel Reservation'
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAST / HISTORY RESERVATIONS */}
            {pastReservations.length > 0 && (
              <div className='flex flex-col gap-6 border-t pt-4'>
                <h2 className='text-muted-foreground flex items-center gap-2 text-xl font-bold tracking-tight'>
                  <History className='size-5' />
                  History
                </h2>

                <div className='grid gap-4 opacity-80 md:grid-cols-2 lg:grid-cols-3'>
                  {pastReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className='bg-muted/30 border-border/50 flex flex-col shadow-none'
                    >
                      <CardContent className='flex flex-col gap-4 p-5'>
                        <div className='flex items-start justify-between gap-4'>
                          <h3 className='text-foreground font-semibold'>
                            {reservation.restaurant.name}
                          </h3>
                          <Badge
                            variant={getStatusBadgeVariant(reservation.status)}
                            className='text-xs'
                          >
                            {reservation.status}
                          </Badge>
                        </div>

                        <div className='flex flex-col gap-2.5'>
                          <div className='text-muted-foreground flex items-center gap-2.5'>
                            <Clock3 className='size-3.5' />
                            <span className='text-sm'>
                              {formatDateTime(reservation.reservationTime)}
                            </span>
                          </div>
                          <div className='text-muted-foreground flex items-center gap-2.5'>
                            <Table2 className='size-3.5' />
                            <span className='text-sm'>
                              Table {reservation.table.tableNumber} · Party of{' '}
                              {reservation.partySize}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
