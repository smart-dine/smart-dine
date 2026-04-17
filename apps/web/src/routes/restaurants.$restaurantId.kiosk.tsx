import { ordersQueryOptions } from '#/lib/api/orders';
import type { OrderStatus, RestaurantOrder, RestaurantOrderStatusPatch } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import type { KioskConnectionState, KioskRealtimeConnection } from '#/lib/realtime/kiosk';
import { createKioskRealtimeConnection } from '#/lib/realtime/kiosk';
import { useRestaurantRouteAccess } from '#/lib/auth/access';
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
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { Bell, Monitor, RefreshCw, SquareMenu, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const orderStatuses: OrderStatus[] = ['placed', 'preparing', 'ready', 'completed'];
const defaultStatusTotals: Record<OrderStatus, number> = {
  placed: 0,
  preparing: 0,
  ready: 0,
  completed: 0,
};

export const Route = createFileRoute('/restaurants/$restaurantId/kiosk')({
  component: KioskPage,
});

function KioskPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const access = useRestaurantRouteAccess(restaurantId, 'kiosk');

  const ordersQuery = useQuery(ordersQueryOptions.restaurantOrders(restaurantId));
  const soundEnabledRef = useRef(false);

  const connectionRef = useRef<KioskRealtimeConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [connectionState, setConnectionState] = useState<KioskConnectionState>('connecting');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [ordersById, setOrdersById] = useState<Record<string, RestaurantOrder>>({});
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('smartdine:kiosk-sound-enabled');
    const isEnabled = storedPreference === 'true';
    soundEnabledRef.current = isEnabled;
    setSoundEnabled(isEnabled);
  }, []);

  useEffect(() => {
    if (!ordersQuery.data) {
      return;
    }

    setOrdersById((current) => {
      const next = { ...current };

      for (const order of ordersQuery.data) {
        next[order.id] = order;
      }

      return next;
    });
  }, [ordersQuery.data]);

  const playNewOrderTone = () => {
    if (!soundEnabledRef.current) {
      return;
    }

    const audioContext = audioContextRef.current ?? new window.AudioContext();
    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const startTime = audioContext.currentTime;
    gain.gain.value = 0.001;
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  };

  const applyStatusPatch = (patch: RestaurantOrderStatusPatch) => {
    setOrdersById((current) => {
      const existing = current[patch.id];
      if (!existing) {
        void queryClient.invalidateQueries({
          queryKey: ['restaurants', 'orders', restaurantId],
        });
        return current;
      }

      return {
        ...current,
        [patch.id]: {
          ...existing,
          status: patch.status,
          completedAt: patch.completedAt,
          totalAmount: patch.totalAmount,
          createdAt: patch.createdAt,
        },
      };
    });
  };

  useEffect(() => {
    if (!access.isAuthenticated || !access.canAccess) {
      return;
    }

    const connection = createKioskRealtimeConnection({
      restaurantId,
      handlers: {
        onConnectionStateChange: setConnectionState,
        onJoinSuccess: () => {
          setJoinError(null);
        },
        onJoinError: (message) => {
          setJoinError(message);
        },
        onOrderCreated: (order) => {
          setOrdersById((current) => ({
            ...current,
            [order.id]: order,
          }));

          setHighlightedOrderIds((current) => ({
            ...current,
            [order.id]: true,
          }));

          window.setTimeout(() => {
            setHighlightedOrderIds((current) => {
              const next = { ...current };
              delete next[order.id];
              return next;
            });
          }, 1400);

          playNewOrderTone();
        },
        onOrderStatusUpdated: applyStatusPatch,
        onOrderCompleted: applyStatusPatch,
      },
    });

    connectionRef.current = connection;

    return () => {
      connection.disconnect();
      connectionRef.current = null;
      setConnectionState('disconnected');
    };
  }, [access.canAccess, access.isAuthenticated, queryClient, restaurantId]);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const connection = connectionRef.current;
      if (!connection) {
        throw new Error('Realtime connection is unavailable.');
      }

      await connection.completeOrder(orderId);
    },
    onMutate: (orderId) => {
      setCompletingOrderId(orderId);
    },
    onSuccess: async (_data, orderId) => {
      setPageError(null);
      setOrdersById((current) => {
        const existing = current[orderId];
        if (!existing) {
          return current;
        }

        return {
          ...current,
          [orderId]: {
            ...existing,
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        };
      });

      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'orders', restaurantId],
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : getApiErrorMessage(error, 'Failed to complete order.');
      setPageError(message);
    },
    onSettled: () => {
      setCompletingOrderId(null);
    },
  });

  const orders = useMemo(
    () =>
      Object.values(ordersById).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [ordersById],
  );

  const filteredOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter],
  );

  const statusTotals = useMemo(
    () =>
      orderStatuses.reduce<Record<OrderStatus, number>>(
        (accumulator, status) => ({
          ...accumulator,
          [status]: orders.filter((order) => order.status === status).length,
        }),
        defaultStatusTotals,
      ),
    [orders],
  );

  if (access.isLoading) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Preparing kitchen kiosk</CardTitle>
            <CardDescription>Checking access and connecting to realtime updates.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!access.isAuthenticated) {
    return (
      <Navigate
        to='/sign-in'
        replace
      />
    );
  }

  if (!access.canAccess) {
    return (
      <Navigate
        to='/'
        replace
      />
    );
  }

  return (
    <main className='container mx-auto flex flex-col gap-4 px-4 py-8'>
      <Card>
        <CardHeader className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <CardTitle className='inline-flex items-center gap-2 text-2xl'>
              <Monitor className='size-5' />
              Kitchen Kiosk
            </CardTitle>
            <CardDescription>
              Live order queue for staff operations.{' '}
              <Link
                to='/restaurants/$restaurantId/cashier'
                params={{ restaurantId }}
                className='text-primary underline-offset-2 hover:underline'
              >
                Open cashier
              </Link>
              .
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Badge
              variant={
                connectionState === 'connected'
                  ? 'default'
                  : connectionState === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {connectionState === 'connected' ? (
                <Wifi className='size-3' />
              ) : (
                <WifiOff className='size-3' />
              )}
              {connectionState}
            </Badge>

            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                const next = !soundEnabled;
                soundEnabledRef.current = next;
                setSoundEnabled(next);
                window.localStorage.setItem('smartdine:kiosk-sound-enabled', String(next));
              }}
            >
              <Bell className='mr-1 size-4' />
              {soundEnabled ? 'Sound on' : 'Enable sound'}
            </Button>

            <Button
              size='sm'
              variant='outline'
              onClick={() => void ordersQuery.refetch()}
            >
              <RefreshCw className='mr-1 size-4' />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            {orderStatuses.map((status) => (
              <div
                key={status}
                className='bg-background rounded-lg border px-3 py-2'
              >
                <p className='text-muted-foreground text-xs uppercase'>{status}</p>
                <p className='text-lg font-semibold'>{statusTotals[status]}</p>
              </div>
            ))}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | OrderStatus)}
            >
              <SelectTrigger className='w-52'>
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

            {ordersQuery.isFetching && (
              <p className='text-muted-foreground text-xs'>Syncing latest orders...</p>
            )}
          </div>

          {joinError && <p className='text-destructive text-sm'>{joinError}</p>}
          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}
        </CardContent>
      </Card>

      {ordersQuery.isPending ? (
        <Card>
          <CardContent className='py-8'>
            <p className='text-muted-foreground text-sm'>Loading live queue...</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length > 0 ? (
        <div className='grid gap-3 lg:grid-cols-2'>
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={highlightedOrderIds[order.id] ? 'ring-primary/50 ring-2' : ''}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0'>
                <div>
                  <CardTitle className='text-base'>Table {order.table.tableNumber}</CardTitle>
                  <CardDescription>
                    {formatDateTime(order.createdAt)} • {formatMoney(order.totalAmount)}
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
                        <span className='text-muted-foreground'> ({item.specialInstructions})</span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    disabled={
                      order.status === 'completed' ||
                      completeOrderMutation.isPending ||
                      connectionState !== 'connected'
                    }
                    onClick={() => completeOrderMutation.mutate(order.id)}
                  >
                    {completeOrderMutation.isPending && completingOrderId === order.id
                      ? 'Completing...'
                      : order.status === 'completed'
                        ? 'Completed'
                        : 'Complete order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='py-8'>
            <p className='text-muted-foreground text-sm'>No orders in this queue yet.</p>
          </CardContent>
        </Card>
      )}

      <Card className='bg-card/60'>
        <CardContent className='flex flex-wrap items-center justify-between gap-3 py-4'>
          <p className='text-muted-foreground text-sm'>
            Tip: keep this screen open during service for realtime updates.
          </p>
          <Button
            asChild
            size='sm'
            variant='outline'
          >
            <Link
              to='/workspace'
            >
              <SquareMenu className='mr-1 size-4' />
              Back to workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
