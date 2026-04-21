import type { MyReservation } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { queryKeys } from '#/lib/api/query-keys';
import { cancelReservation, reservationsQueryOptions } from '#/lib/api/reservations';
import { authClient } from '#/lib/auth-client';
import { formatDateTime } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { CalendarClock, Clock3, MapPin, Table2 } from 'lucide-react';
import { useState } from 'react';

const isPastReservation = (reservation: MyReservation) =>
  new Date(reservation.reservationEndTime).getTime() < Date.now();

const isTerminalReservationStatus = (status: MyReservation['status']) =>
  status === 'completed' || status === 'cancelled';

const isOldReservation = (reservation: MyReservation) =>
  isPastReservation(reservation) || isTerminalReservationStatus(reservation.status);

const getStatusBadgeVariant = (status: MyReservation['status']) => {
  if (status === 'confirmed') {
    return 'default';
  }

  if (status === 'cancelled') {
    return 'destructive';
  }

  if (status === 'completed') {
    return 'outline';
  }

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

  if (sessionPending) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Loading reservations</CardTitle>
            <CardDescription>Checking your account session.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <Navigate
        to='/sign-in'
        search={{
          redirect: '/me/reservations',
        }}
        replace
      />
    );
  }

  const reservations = reservationsQuery.data ?? [];

  return (
    <main className='container mx-auto flex flex-col gap-5 px-4 py-8'>
      <section className='space-y-2'>
        <p className='text-primary inline-flex items-center gap-2 text-sm font-medium'>
          <CalendarClock className='size-4' />
          My Reservations
        </p>
        <h1 className='text-3xl font-semibold tracking-tight'>Your reservation history</h1>
        <p className='text-muted-foreground'>
          View reservation statuses and cancel upcoming reservations if your plans change.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>
            Old reservations are grayed out once completed, cancelled, or when their end time has
            passed.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}

          {reservationsQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading your reservations...</p>
          ) : reservations.length > 0 ? (
            <div className='space-y-3'>
              {reservations.map((reservation) => {
                const isOld = isOldReservation(reservation);
                const cancelInProgress =
                  cancelMutation.isPending && cancelingReservationId === reservation.id;

                return (
                  <div
                    key={reservation.id}
                    className={`rounded-xl border p-4 ${isOld ? 'bg-muted/45 text-muted-foreground' : ''}`}
                  >
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      <div className='space-y-1.5'>
                        <p className='text-base font-medium'>{reservation.restaurant.name}</p>

                        <p className='inline-flex items-center gap-1.5 text-sm'>
                          <MapPin className='size-3.5' />
                          {reservation.restaurant.address}
                        </p>

                        <p className='inline-flex items-center gap-1.5 text-sm'>
                          <Table2 className='size-3.5' />
                          Table {reservation.table.tableNumber} · Party of {reservation.partySize}
                        </p>

                        <p className='inline-flex items-center gap-1.5 text-sm'>
                          <Clock3 className='size-3.5' />
                          {formatDateTime(reservation.reservationTime)}
                        </p>
                      </div>

                      <div className='flex flex-col items-start gap-2 sm:items-end'>
                        <Badge variant={getStatusBadgeVariant(reservation.status)}>
                          {reservation.status}
                        </Badge>

                        <Button
                          variant='destructive'
                          size='sm'
                          disabled={isOld || cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(reservation.id)}
                        >
                          {cancelInProgress ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-muted-foreground text-sm'>You do not have any reservations yet.</p>
              <Button
                asChild
                variant='outline'
              >
                <Link to='/'>Browse restaurants</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
