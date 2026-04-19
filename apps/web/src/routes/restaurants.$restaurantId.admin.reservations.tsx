import {
  cancelReservation,
  reservationsQueryOptions,
  updateReservationStatus,
} from '#/lib/api/reservations';
import type { ReservationStatus } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartdine/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartdine/ui/components/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';

const reservationStatuses: ReservationStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];

export const Route = createFileRoute('/restaurants/$restaurantId/admin/reservations')({
  component: RestaurantReservationsPage,
});

function RestaurantReservationsPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();

  const [statusDraftByReservationId, setStatusDraftByReservationId] = useState<
    Record<string, ReservationStatus>
  >({});
  const [pageError, setPageError] = useState<string | null>(null);

  const reservationsQuery = useQuery(reservationsQueryOptions.restaurantReservations(restaurantId));

  const updateStatusMutation = useMutation({
    mutationFn: ({ reservationId, status }: { reservationId: string; status: ReservationStatus }) =>
      updateReservationStatus(reservationId, { status }),
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'reservations', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to update reservation status.'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelReservation,
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'reservations', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to cancel reservation.'));
    },
  });

  const reservations = reservationsQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='inline-flex items-center gap-2'>
          <CalendarClock className='size-4' />
          Reservations
        </CardTitle>
        <CardDescription>Manage reservation lifecycle for this restaurant.</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {pageError && <p className='text-destructive text-sm'>{pageError}</p>}

        {reservationsQuery.isPending ? (
          <p className='text-muted-foreground text-sm'>Loading reservations...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => {
                const selectedStatus =
                  statusDraftByReservationId[reservation.id] ?? reservation.status;

                return (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className='space-y-1'>
                        <p className='font-medium'>{reservation.customer.name}</p>
                        <p className='text-muted-foreground text-xs'>
                          {reservation.customer.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.table.tableNumber}</TableCell>
                    <TableCell>{formatDateTime(reservation.reservationTime)}</TableCell>
                    <TableCell>{reservation.partySize}</TableCell>
                    <TableCell>
                      <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) =>
                            setStatusDraftByReservationId((current) => ({
                              ...current,
                              [reservation.id]: value as ReservationStatus,
                            }))
                          }
                        >
                          <SelectTrigger className='w-36'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {reservationStatuses.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                              >
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant='outline'
                          size='sm'
                          disabled={
                            selectedStatus === reservation.status || updateStatusMutation.isPending
                          }
                          onClick={() =>
                            updateStatusMutation.mutate({
                              reservationId: reservation.id,
                              status: selectedStatus,
                            })
                          }
                        >
                          Save
                        </Button>

                        <Button
                          variant='destructive'
                          size='sm'
                          disabled={reservation.status === 'cancelled' || cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(reservation.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {reservations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground py-8 text-center'
                  >
                    No reservations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
