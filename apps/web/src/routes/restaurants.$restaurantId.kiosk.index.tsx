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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import {
  Bell,
  Maximize,
  Minimize,
  Monitor,
  RefreshCw,
  SquareMenu,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const orderStatuses: OrderStatus[] = ['placed', 'completed'];
type KioskStatusFilter = OrderStatus;

const statusFilters: Array<{ value: KioskStatusFilter; label: string }> = [
  { value: 'placed', label: 'Placed' },
  { value: 'completed', label: 'Completed' },
];

const PLACED_WARNING_MINUTES = 8;
const PLACED_URGENT_MINUTES = 15;

const placedFreshCardTone =
  'border-emerald-300/60 bg-emerald-50/55 dark:border-emerald-500/35 dark:bg-emerald-950/20';
const placedWarningCardTone =
  'border-amber-300/65 bg-amber-50/65 dark:border-amber-500/45 dark:bg-amber-950/30';
const placedUrgentCardTone =
  'border-rose-400/75 bg-rose-50/75 dark:border-rose-500/55 dark:bg-rose-950/32';
const completedCardTone =
  'border-zinc-300/80 bg-zinc-100/70 dark:border-zinc-700/70 dark:bg-zinc-900/55';

const defaultStatusTotals: Record<OrderStatus, number> = {
  placed: 0,
  completed: 0,
};

const getDateTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getPlacedMinutes = (createdAt: string, nowMs: number) => {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - createdAtMs) / 60_000));
};

const getPlacedCardTone = (placedMinutes: number) => {
  if (placedMinutes >= PLACED_URGENT_MINUTES) {
    return placedUrgentCardTone;
  }

  if (placedMinutes >= PLACED_WARNING_MINUTES) {
    return placedWarningCardTone;
  }

  return placedFreshCardTone;
};

const getOrderCardTone = (order: RestaurantOrder, nowMs: number) => {
  if (order.status === 'placed') {
    return getPlacedCardTone(getPlacedMinutes(order.createdAt, nowMs));
  }

  return completedCardTone;
};

export const Route = createFileRoute('/restaurants/$restaurantId/kiosk/')({
  component: KioskPage,
});

function KioskPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const access = useRestaurantRouteAccess(restaurantId, 'kiosk');

  const ordersQuery = useQuery(ordersQueryOptions.restaurantOrders(restaurantId));
  const soundEnabledRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  const connectionRef = useRef<KioskRealtimeConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [connectionState, setConnectionState] = useState<KioskConnectionState>('connecting');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<KioskStatusFilter>('placed');
  const [ordersById, setOrdersById] = useState<Partial<Record<string, RestaurantOrder>>>({});
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('smartdine:kiosk-sound-enabled');
    const isEnabled = storedPreference === 'true';
    soundEnabledRef.current = isEnabled;
    setSoundEnabled(isEnabled);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!mainRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await mainRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!ordersQuery.data) {
      return;
    }

    setOrdersById(
      Object.fromEntries(ordersQuery.data.map((order) => [order.id, order])) as Partial<
        Record<string, RestaurantOrder>
      >,
    );
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
        error instanceof Error
          ? error.message
          : getApiErrorMessage(error, 'Failed to complete order.');
      setPageError(message);
    },
    onSettled: () => {
      setCompletingOrderId(null);
    },
  });

  const orders = useMemo(
    () => Object.values(ordersById).filter((order): order is RestaurantOrder => Boolean(order)),
    [ordersById],
  );

  const placedOrders = useMemo(
    () =>
      [...orders]
        .filter((order) => order.status === 'placed')
        .sort(
          (left, right) => getDateTimestamp(left.createdAt) - getDateTimestamp(right.createdAt),
        ),
    [orders],
  );

  const completedOrders = useMemo(
    () =>
      [...orders]
        .filter((order) => order.status === 'completed')
        .sort(
          (left, right) =>
            getDateTimestamp(right.completedAt ?? right.createdAt) -
            getDateTimestamp(left.completedAt ?? left.createdAt),
        ),
    [orders],
  );

  const filteredOrders = statusFilter === 'placed' ? placedOrders : completedOrders;

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
    <main
      ref={mainRef}
      className='container mx-auto flex flex-col gap-4 px-4 py-6'
    >
      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <CardTitle className='inline-flex items-center gap-2 text-3xl'>
              <Monitor className='size-5' />
              Kitchen Kiosk
            </CardTitle>

            <Badge
              variant={
                connectionState === 'connected'
                  ? 'default'
                  : connectionState === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
              className='inline-flex min-h-11 items-center gap-2 px-3 text-sm'
            >
              {connectionState === 'connected' ? (
                <Wifi className='size-4' />
              ) : (
                <WifiOff className='size-4' />
              )}
              {connectionState}
            </Badge>
          </div>

          <CardDescription className='text-base'>
            Large touch-first kitchen queue. Keep this screen open for live updates.{' '}
            <Link
              to='/restaurants/$restaurantId/cashier'
              params={{ restaurantId }}
              className='text-primary underline-offset-2 hover:underline'
            >
              Open cashier
            </Link>
            .
          </CardDescription>

          <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
            {orderStatuses.map((status) => (
              <div
                key={status}
                className='bg-background rounded-lg border px-4 py-3'
              >
                <p className='text-muted-foreground text-xs uppercase'>{status}</p>
                <p className='text-2xl font-semibold'>{statusTotals[status]}</p>
              </div>
            ))}
          </div>

          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                className='h-12 text-base font-semibold'
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}

            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              className='h-12 text-base font-semibold'
              onClick={() => {
                const next = !soundEnabled;
                soundEnabledRef.current = next;
                setSoundEnabled(next);
                window.localStorage.setItem('smartdine:kiosk-sound-enabled', String(next));
              }}
            >
              <Bell className='mr-2 size-4' />
              {soundEnabled ? 'Sound on' : 'Enable sound'}
            </Button>

            <Button
              className='h-12 text-base font-semibold'
              variant='outline'
              onClick={() => void ordersQuery.refetch()}
            >
              <RefreshCw className='mr-2 size-4' />
              Refresh queue
            </Button>

            <Button
              className='h-12 text-base font-semibold'
              variant={isFullscreen ? 'default' : 'outline'}
              onClick={() => void toggleFullscreen()}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className='mr-2 size-4' />
              ) : (
                <Maximize className='mr-2 size-4' />
              )}
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
          </div>

          <div className='space-y-1'>
            {ordersQuery.isFetching && (
              <p className='text-muted-foreground text-sm'>Syncing latest orders...</p>
            )}

            {joinError && <p className='text-destructive text-sm'>{joinError}</p>}
            {pageError && <p className='text-destructive text-sm'>{pageError}</p>}
          </div>
        </CardHeader>
      </Card>

      {ordersQuery.isPending ? (
        <Card>
          <CardContent className='py-10'>
            <p className='text-muted-foreground text-base'>Loading kitchen queue...</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length > 0 ? (
        <section className='grid gap-4 xl:grid-cols-2'>
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`${getOrderCardTone(order, nowMs)} ${highlightedOrderIds[order.id] ? 'ring-primary ring-2 ring-offset-2' : ''}`}
            >
              <CardHeader className='space-y-3'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <CardTitle className='text-2xl'>Table {order.table.tableNumber}</CardTitle>
                    <CardDescription className='text-base'>
                      {formatDateTime(order.createdAt)} • {formatMoney(order.totalAmount)}
                    </CardDescription>
                    {order.status === 'placed' && (
                      <Badge
                        variant='outline'
                        className='mt-2'
                      >
                        Placed {getPlacedMinutes(order.createdAt, nowMs)}m ago
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant={order.status === 'completed' ? 'default' : 'secondary'}
                    className='px-3 py-1 text-sm uppercase'
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                <ul className='space-y-2'>
                  {order.orderItems.map((item) => (
                    <li
                      key={item.id}
                      className='bg-background/80 rounded-md border px-3 py-2 text-base'
                    >
                      <span className='font-semibold'>x{item.quantity}</span> {item.menuItem.name}
                      {item.specialInstructions && (
                        <span className='text-muted-foreground'> ({item.specialInstructions})</span>
                      )}
                    </li>
                  ))}
                </ul>

                <Button
                  size='lg'
                  className='h-14 w-full text-lg font-semibold'
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
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card>
          <CardContent className='py-10'>
            <p className='text-muted-foreground text-base'>
              {statusFilter === 'placed'
                ? 'No placed orders in the kitchen queue.'
                : 'No completed orders yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className='bg-card/60'>
        <CardContent className='flex flex-wrap items-center justify-between gap-3 py-4'>
          <p className='text-muted-foreground text-sm'>
            Placed orders shift from green to amber to red as wait time increases.
          </p>
          <Button
            asChild
            size='sm'
            variant='outline'
          >
            <Link to='/workspace'>
              <SquareMenu className='mr-1 size-4' />
              Back to workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
