import { ordersQueryOptions, updateOrderStatus } from '#/lib/api/orders';
import type { OrderStatus } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { formatDateTime, formatMoney } from '#/lib/formatters';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';

const orderStatuses: OrderStatus[] = ['placed', 'preparing', 'ready', 'completed'];

export const Route = createFileRoute('/restaurants/$restaurantId/admin/orders')({
  component: RestaurantOrdersPage,
});

function RestaurantOrdersPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [statusDraftByOrderId, setStatusDraftByOrderId] = useState<Record<string, OrderStatus>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  const ordersQuery = useQuery(
    ordersQueryOptions.restaurantOrders(restaurantId, {
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, { status }),
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'orders', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to update order status.'));
    },
  });

  const orders = ordersQuery.data ?? [];

  const groupedTotals = useMemo(
    () =>
      orderStatuses.reduce<Record<OrderStatus, number>>(
        (accumulator, status) => ({
          ...accumulator,
          [status]: orders.filter((order) => order.status === status).length,
        }),
        {
          placed: 0,
          preparing: 0,
          ready: 0,
          completed: 0,
        },
      ),
    [orders],
  );

  return (
    <div className='grid gap-4'>
      <Card>
        <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle className='inline-flex items-center gap-2'>
              <ClipboardList className='size-4' />
              Order Monitor
            </CardTitle>
            <CardDescription>
              Track and move order states across the kitchen lifecycle.
            </CardDescription>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | OrderStatus)}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {orderStatuses.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className='space-y-3'>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            {orderStatuses.map((status) => (
              <div
                key={status}
                className='bg-background rounded-lg border px-3 py-2'
              >
                <p className='text-muted-foreground text-xs uppercase'>{status}</p>
                <p className='text-lg font-semibold'>{groupedTotals[status]}</p>
              </div>
            ))}
          </div>

          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}
        </CardContent>
      </Card>

      {ordersQuery.isPending ? (
        <Card>
          <CardContent className='py-8'>
            <p className='text-muted-foreground text-sm'>Loading orders...</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-3'>
          {orders.map((order) => {
            const selectedStatus = statusDraftByOrderId[order.id] ?? (order.status as OrderStatus);

            return (
              <Card key={order.id}>
                <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <CardTitle className='text-base'>Table {order.table.tableNumber}</CardTitle>
                    <CardDescription>
                      Created {formatDateTime(order.createdAt)} • {formatMoney(order.totalAmount)}
                    </CardDescription>
                  </div>

                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </CardHeader>

                <CardContent className='space-y-3'>
                  <ul className='space-y-1'>
                    {order.orderItems.map((item) => (
                      <li
                        key={item.id}
                        className='text-sm'
                      >
                        <span className='font-medium'>x{item.quantity}</span> {item.menuItem.name}
                        {item.specialInstructions && (
                          <span className='text-muted-foreground'>
                            {' '}
                            ({item.specialInstructions})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) =>
                        setStatusDraftByOrderId((current) => ({
                          ...current,
                          [order.id]: value as OrderStatus,
                        }))
                      }
                    >
                      <SelectTrigger className='w-44'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
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
                      disabled={selectedStatus === order.status || updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          orderId: order.id,
                          status: selectedStatus,
                        })
                      }
                    >
                      Save status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <Card>
              <CardContent className='py-8'>
                <p className='text-muted-foreground text-sm'>No orders for the selected filter.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
