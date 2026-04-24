import { useRestaurantRouteAccess } from '#/lib/auth/access';
import type { CreateOrderItemInput, RestaurantMenuItemWithCategories } from '#/lib/api/contracts';
import { createRestaurantOrder, ordersQueryOptions, updateOrderStatus } from '#/lib/api/orders';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { getApiErrorMessage } from '#/lib/api/http';
import { formatMoney } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Label } from '@smartdine/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@smartdine/ui/components/select';
import { Input } from '@smartdine/ui/components/input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { Minus, Plus, ShoppingBasket, X, ChefHat, AlertCircle, Clock, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CashierLineItem extends CreateOrderItemInput {}

export const Route = createFileRoute('/restaurants/$restaurantId/cashier/')({
  component: CashierPage,
});

function CashierPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const access = useRestaurantRouteAccess(restaurantId, 'cashier');

  const menuQuery = useQuery(restaurantsQueryOptions.menu(restaurantId));
  const categoriesQuery = useQuery(restaurantsQueryOptions.categories(restaurantId));
  const floorMapQuery = useQuery(restaurantsQueryOptions.floorMap(restaurantId));
  const openOrdersQuery = useQuery(
    ordersQueryOptions.restaurantOrders(restaurantId, {
      status: 'placed',
    }),
  );

  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [lineItems, setLineItems] = useState<CashierLineItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  const createOrderMutation = useMutation({
    mutationFn: ({ tableId, items }: { tableId: string; items: CashierLineItem[] }) =>
      createRestaurantOrder(restaurantId, {
        tableId,
        items,
      }),
    onSuccess: async () => {
      setPageError(null);
      setLineItems([]);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'orders', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to submit order.'));
    },
  });

  const closeOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      updateOrderStatus(orderId, {
        status: 'completed',
      }),
    onSuccess: async () => {
      setPageError(null);
      setLineItems([]);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'orders', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to close order.'));
    },
  });

  const menuItems = useMemo(() => {
    const available = (menuQuery.data ?? []).filter((item) => item.isAvailable);
    if (selectedCategoryIds.size === 0) return available;
    return available.filter((item) =>
      item.categories.some((ic) => selectedCategoryIds.has(ic.categoryId)),
    );
  }, [menuQuery.data, selectedCategoryIds]);

  const menuItemsById = useMemo(
    () =>
      (menuQuery.data ?? []).reduce<Partial<Record<string, RestaurantMenuItemWithCategories>>>(
        (accumulator, item) => {
          accumulator[item.id] = item;
          return accumulator;
        },
        {},
      ),
    [menuQuery.data],
  );

  const activeTableOrder = useMemo(() => {
    if (!selectedTableId) return null;
    const matchingOrders = (openOrdersQuery.data ?? []).filter(
      (order) => order.tableId === selectedTableId,
    );
    if (matchingOrders.length === 0) return null;
    return [...matchingOrders].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
  }, [openOrdersQuery.data, selectedTableId]);

  const activeOrderIncompleteItemCount =
    activeTableOrder?.orderItems.filter((item) => item.status !== 'completed').length ?? 0;

  const orderTotal = lineItems.reduce((total, item) => {
    const menuItem = menuItemsById[item.menuItemId];
    return menuItem ? total + menuItem.price * item.quantity : total;
  }, 0);

  // ---------------------------------------------------------------------------
  // AUTH & LOADING STATES
  // ---------------------------------------------------------------------------
  if (access.isLoading) {
    return (
      <main className='bg-background flex min-h-[80vh] flex-col items-center justify-center gap-4'>
        <ChefHat className='text-primary/50 size-12 animate-pulse' />
        <div className='text-center'>
          <h2 className='text-xl font-semibold'>Initializing POS...</h2>
          <p className='text-muted-foreground'>Loading menu and workspace data</p>
        </div>
      </main>
    );
  }

  if (!access.isAuthenticated)
    return (
      <Navigate
        to='/sign-in'
        replace
      />
    );
  if (!access.canAccess)
    return (
      <Navigate
        to='/'
        replace
      />
    );

  // ---------------------------------------------------------------------------
  // MAIN POS RENDER
  // ---------------------------------------------------------------------------
  return (
    <main className='bg-muted/20 flex min-h-screen flex-col'>
      {/* POS Top Bar */}
      <section className='bg-background sticky top-0 z-10 container mx-auto flex w-full flex-wrap items-center justify-between gap-4 border-b px-6 py-4 shadow-sm'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-sm'>
            <ShoppingBasket className='size-5' />
          </div>
          <div>
            <h1 className='text-lg leading-tight font-bold'>Cashier Terminal</h1>
            <p className='text-muted-foreground text-xs font-medium'>Order Entry System</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            asChild
            variant='outline'
            size='sm'
            className='hidden sm:flex'
          >
            <Link
              to='/restaurants/$restaurantId/admin/orders'
              params={{ restaurantId }}
            >
              Kitchen Display
            </Link>
          </Button>
          <Button
            asChild
            variant='outline'
            size='sm'
            className='hidden sm:flex'
          >
            <Link
              to='/restaurants/$restaurantId/kiosk'
              params={{ restaurantId }}
            >
              Kiosk Mode
            </Link>
          </Button>
        </div>
      </section>

      {/* Main POS Grid */}
      <div className='container mx-auto flex-1 p-4 lg:p-6'>
        <div className='grid h-full items-start gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px]'>
          {/* LEFT COLUMN: Menu Selection Area */}
          <div className='flex flex-col gap-6'>
            {/* Category Filter Bar */}
            {categoriesQuery.isPending ? (
              <div className='bg-muted h-10 animate-pulse rounded-md' />
            ) : (
              (categoriesQuery.data ?? []).length > 0 && (
                <div className='scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2'>
                  <Button
                    variant={selectedCategoryIds.size === 0 ? 'default' : 'secondary'}
                    className='shrink-0 rounded-full'
                    onClick={() => setSelectedCategoryIds(new Set())}
                  >
                    All Items
                  </Button>
                  {categoriesQuery.data?.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategoryIds.has(category.id) ? 'default' : 'secondary'}
                      className='shrink-0 rounded-full'
                      onClick={() => {
                        const next = new Set(selectedCategoryIds);
                        if (next.has(category.id)) next.delete(category.id);
                        else next.add(category.id);
                        setSelectedCategoryIds(next);
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                  {selectedCategoryIds.size > 0 && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-full'
                      onClick={() => setSelectedCategoryIds(new Set())}
                    >
                      <X className='size-4' />
                    </Button>
                  )}
                </div>
              )
            )}

            {/* Menu Items Grid */}
            {menuQuery.isPending ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className='bg-muted h-32 animate-pulse rounded-2xl'
                  />
                ))}
              </div>
            ) : menuItems.length === 0 ? (
              <div className='bg-background text-muted-foreground flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed'>
                <ChefHat className='mb-2 size-10 opacity-20' />
                <p>No menu items found in this category.</p>
              </div>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {menuItems.map((menuItem) => (
                  <button
                    key={menuItem.id}
                    type='button'
                    className='group bg-background hover:border-primary relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]'
                    onClick={() => {
                      setLineItems((current) => {
                        const existing = current.find((item) => item.menuItemId === menuItem.id);
                        if (!existing) {
                          return [
                            ...current,
                            { menuItemId: menuItem.id, quantity: 1, specialInstructions: '' },
                          ];
                        }
                        return current.map((item) =>
                          item.menuItemId === menuItem.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item,
                        );
                      });
                    }}
                  >
                    <div className='w-full space-y-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <h3 className='text-foreground line-clamp-2 leading-tight font-bold'>
                          {menuItem.name}
                        </h3>
                      </div>
                      <p className='text-muted-foreground line-clamp-2 text-xs'>
                        {menuItem.description || 'No description'}
                      </p>
                    </div>

                    <div className='mt-auto flex w-full items-center justify-between'>
                      <span className='text-primary font-bold'>{formatMoney(menuItem.price)}</span>
                      <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100'>
                        <Plus className='size-4' />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: The Receipt / Order Tab */}
          <div className='bg-background flex flex-col overflow-hidden rounded-2xl border shadow-xl lg:sticky lg:top-24'>
            {/* Receipt Header (Table Selection) */}
            <div className='bg-muted/10 border-b p-4'>
              <Label className='text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase'>
                Select Table
              </Label>
              <Select
                value={selectedTableId}
                onValueChange={(value) => {
                  setSelectedTableId(value);
                  setLineItems([]);
                  setPageError(null);
                }}
              >
                <SelectTrigger className='bg-background h-12 text-base font-semibold shadow-sm'>
                  <SelectValue placeholder='Choose a table to begin...' />
                </SelectTrigger>
                <SelectContent>
                  {(floorMapQuery.data?.tables ?? []).map((table) => (
                    <SelectItem
                      key={table.id}
                      value={table.id}
                      className='font-medium'
                    >
                      Table {table.tableNumber}{' '}
                      <span className='text-muted-foreground ml-1 font-normal'>
                        ({table.capacity} seats)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Receipt Body (Scrollable Items) */}
            <div className='scrollbar-thin max-h-[50dvh] flex-1 overflow-y-auto p-4'>
              {!selectedTableId ? (
                <div className='text-muted-foreground flex h-full flex-col items-center justify-center text-center'>
                  <ShoppingBasket className='mb-3 size-12 opacity-20' />
                  <p>Select a table to open a tab.</p>
                </div>
              ) : (
                <div className='flex flex-col gap-6'>
                  {/* OPEN TAB SECTION (Already submitted items) */}
                  {openOrdersQuery.isPending ? (
                    <p className='text-muted-foreground animate-pulse text-sm'>
                      Loading active tab...
                    </p>
                  ) : activeTableOrder ? (
                    <div className='flex flex-col gap-2'>
                      <div className='text-muted-foreground mb-1 flex items-center justify-between text-xs font-bold tracking-wider uppercase'>
                        <span className='flex items-center gap-1.5'>
                          <Clock className='size-3.5' /> Sent to Kitchen
                        </span>
                        <span>{activeTableOrder.orderItems.length} items</span>
                      </div>

                      <div className='flex flex-col gap-2'>
                        {activeTableOrder.orderItems.map((item) => (
                          <div
                            key={item.id}
                            className='bg-muted/30 flex flex-col gap-1 rounded-lg border border-dashed p-3 opacity-80'
                          >
                            <div className='flex items-start justify-between gap-3 text-sm'>
                              <span className='text-foreground font-medium'>
                                <span className='text-muted-foreground mr-1.5'>
                                  {item.quantity}x
                                </span>
                                {item.menuItem.name}
                              </span>
                              <Badge
                                variant={item.status === 'completed' ? 'outline' : 'secondary'}
                                className='text-[10px] uppercase'
                              >
                                {item.status}
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <p className='text-muted-foreground pl-6 text-xs italic'>
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* NEW ITEMS SECTION (Currently building) */}
                  <div className='flex flex-col gap-3'>
                    {lineItems.length > 0 && (
                      <div className='text-primary mb-1 border-b pb-2 text-xs font-bold tracking-wider uppercase'>
                        New Items
                      </div>
                    )}

                    {lineItems.map((lineItem) => {
                      const menuItem = menuItemsById[lineItem.menuItemId];
                      return (
                        <div
                          key={lineItem.menuItemId}
                          className='bg-card flex flex-col gap-2 rounded-xl border p-3 shadow-sm'
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex-1'>
                              <p className='leading-tight font-bold'>
                                {menuItem?.name ?? 'Unknown item'}
                              </p>
                              <p className='text-primary text-sm'>
                                {menuItem ? formatMoney(menuItem.price * lineItem.quantity) : ''}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className='bg-background flex items-center rounded-lg border shadow-sm'>
                              <button
                                type='button'
                                className='text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-l-lg transition-colors'
                                onClick={() =>
                                  setLineItems((current) =>
                                    current
                                      .map((item) =>
                                        item.menuItemId === lineItem.menuItemId
                                          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                                          : item,
                                      )
                                      .filter((item) => item.quantity > 0),
                                  )
                                }
                              >
                                <Minus className='size-3.5' />
                              </button>
                              <span className='w-8 text-center text-sm font-bold'>
                                {lineItem.quantity}
                              </span>
                              <button
                                type='button'
                                className='text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-r-lg transition-colors'
                                onClick={() =>
                                  setLineItems((current) =>
                                    current.map((item) =>
                                      item.menuItemId === lineItem.menuItemId
                                        ? { ...item, quantity: item.quantity + 1 }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <Plus className='size-3.5' />
                              </button>
                            </div>
                          </div>

                          {/* Inline Prep Notes */}
                          <Input
                            className='bg-muted/30 h-8 border-dashed text-xs focus-visible:ring-1'
                            placeholder='Add prep note...'
                            value={lineItem.specialInstructions ?? ''}
                            onChange={(event) =>
                              setLineItems((current) =>
                                current.map((item) =>
                                  item.menuItemId === lineItem.menuItemId
                                    ? { ...item, specialInstructions: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Footer (Actions & Totals) */}
            <div className='bg-muted/10 flex flex-col gap-3 border-t p-4'>
              {pageError && (
                <div className='bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-2 text-xs font-medium'>
                  <AlertCircle className='size-4 shrink-0' />
                  {pageError}
                </div>
              )}

              {/* Totals Breakdown */}
              <div className='mb-2 flex flex-col gap-1.5'>
                {activeTableOrder && (
                  <div className='text-muted-foreground flex items-center justify-between text-sm'>
                    <span>Previous Tab Total</span>
                    <span>{formatMoney(activeTableOrder.totalAmount)}</span>
                  </div>
                )}
                {lineItems.length > 0 && (
                  <div className='text-primary flex items-center justify-between text-lg font-bold'>
                    <span>New Items Total</span>
                    <span>{formatMoney(orderTotal)}</span>
                  </div>
                )}
              </div>

              {/* Core Actions */}
              <div className='grid gap-2'>
                <Button
                  size='lg'
                  className='h-12 w-full text-base font-bold shadow-md'
                  disabled={
                    !selectedTableId || lineItems.length === 0 || createOrderMutation.isPending
                  }
                  onClick={() =>
                    createOrderMutation.mutate({
                      tableId: selectedTableId,
                      items: lineItems,
                    })
                  }
                >
                  {createOrderMutation.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className='mr-2 size-4' /> Send {lineItems.length} to Kitchen
                    </>
                  )}
                </Button>

                <Button
                  variant='outline'
                  size='lg'
                  className='border-destructive/20 text-destructive hover:bg-destructive/10 h-12 w-full'
                  disabled={
                    !activeTableOrder ||
                    activeOrderIncompleteItemCount > 0 ||
                    lineItems.length > 0 ||
                    closeOrderMutation.isPending
                  }
                  onClick={() => {
                    if (activeTableOrder) closeOrderMutation.mutate(activeTableOrder.id);
                  }}
                >
                  {closeOrderMutation.isPending ? 'Closing...' : 'Close & Pay Table'}
                </Button>

                {/* Status Helpers */}
                {activeTableOrder &&
                  activeOrderIncompleteItemCount > 0 &&
                  lineItems.length === 0 && (
                    <p className='text-muted-foreground text-center text-xs'>
                      Cannot close table: {activeOrderIncompleteItemCount} item(s) still cooking.
                    </p>
                  )}
                {activeTableOrder && lineItems.length > 0 && (
                  <p className='text-muted-foreground text-center text-xs'>
                    Send new items to kitchen before closing.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
