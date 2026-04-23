import { useRestaurantRouteAccess } from '#/lib/auth/access';
import type { CreateOrderItemInput, RestaurantMenuItemWithCategories } from '#/lib/api/contracts';
import { createRestaurantOrder, ordersQueryOptions, updateOrderStatus } from '#/lib/api/orders';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { getApiErrorMessage } from '#/lib/api/http';
import { formatMoney } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Label } from '@smartdine/ui/components/label';
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
import { Textarea } from '@smartdine/ui/components/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { Minus, Plus, ShoppingBasket, X } from 'lucide-react';
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

    // If no categories selected, show all available items
    if (selectedCategoryIds.size === 0) {
      return available;
    }

    // Filter items to those that have at least one selected category
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
    if (!selectedTableId) {
      return null;
    }

    const matchingOrders = (openOrdersQuery.data ?? []).filter(
      (order) => order.tableId === selectedTableId,
    );

    if (matchingOrders.length === 0) {
      return null;
    }

    return [...matchingOrders].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
  }, [openOrdersQuery.data, selectedTableId]);

  const activeOrderIncompleteItemCount =
    activeTableOrder?.orderItems.filter((item) => item.status !== 'completed').length ?? 0;

  const orderTotal = lineItems.reduce((total, item) => {
    const menuItem = menuItemsById[item.menuItemId];
    if (!menuItem) {
      return total;
    }

    return total + menuItem.price * item.quantity;
  }, 0);

  if (access.isLoading) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Preparing cashier workspace</CardTitle>
            <CardDescription>Checking your access and loading current menu data.</CardDescription>
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
    <main className='container mx-auto grid gap-4 px-4 py-8 lg:grid-cols-[1.6fr_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle className='inline-flex items-center gap-2'>
            <ShoppingBasket className='size-4' />
            Cashier • Build Order
          </CardTitle>
          <CardDescription>
            Select menu items and quantities, then submit to kitchen workflow.{' '}
            <Link
              to='/restaurants/$restaurantId/admin/orders'
              params={{ restaurantId }}
              className='text-primary underline-offset-2 hover:underline'
            >
              Open order monitor
            </Link>{' '}
            or{' '}
            <Link
              to='/restaurants/$restaurantId/kiosk'
              params={{ restaurantId }}
              className='text-primary underline-offset-2 hover:underline'
            >
              open kiosk
            </Link>
            .
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-3'>
          {menuQuery.isPending || categoriesQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading menu and categories...</p>
          ) : (
            <>
              {(categoriesQuery.data ?? []).length > 0 && (
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Filter by category</p>
                  <div className='flex flex-wrap gap-2'>
                    {categoriesQuery.data?.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategoryIds.has(category.id) ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => {
                          const next = new Set(selectedCategoryIds);
                          if (next.has(category.id)) {
                            next.delete(category.id);
                          } else {
                            next.add(category.id);
                          }
                          setSelectedCategoryIds(next);
                        }}
                      >
                        {category.name}
                      </Button>
                    ))}
                    {selectedCategoryIds.size > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedCategoryIds(new Set())}
                        className='text-muted-foreground'
                      >
                        <X className='mr-1 size-3' />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className='grid gap-3 sm:grid-cols-2'>
                {menuItems.map((menuItem) => (
                  <div
                    key={menuItem.id}
                    className='bg-background rounded-xl border p-4'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1'>
                        <p className='font-medium'>{menuItem.name}</p>
                        <p className='text-muted-foreground text-xs'>
                          {menuItem.description || 'No description'}
                        </p>
                        {menuItem.categories.length > 0 && (
                          <div className='mt-2 flex flex-wrap gap-1'>
                            {menuItem.categories.map((ic) => (
                              <Badge
                                key={ic.categoryId}
                                variant='secondary'
                                className='text-xs'
                              >
                                {ic.category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge>{formatMoney(menuItem.price)}</Badge>
                    </div>

                    <Button
                      className='mt-3 w-full'
                      variant='outline'
                      onClick={() => {
                        setLineItems((current) => {
                          const existing = current.find((item) => item.menuItemId === menuItem.id);
                          if (!existing) {
                            return [
                              ...current,
                              {
                                menuItemId: menuItem.id,
                                quantity: 1,
                                specialInstructions: '',
                              },
                            ];
                          }

                          return current.map((item) =>
                            item.menuItemId === menuItem.id
                              ? {
                                  ...item,
                                  quantity: item.quantity + 1,
                                }
                              : item,
                          );
                        });
                      }}
                    >
                      <Plus className='mr-1 size-4' />
                      Add to order
                    </Button>
                  </div>
                ))}

                {menuItems.length === 0 && (
                  <p className='text-muted-foreground text-sm'>No available menu items found.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Order</CardTitle>
          <CardDescription>Choose table and finalize line items before submit.</CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='grid gap-2'>
            <Label>Table</Label>
            <Select
              value={selectedTableId}
              onValueChange={(value) => {
                setSelectedTableId(value);
                setLineItems([]);
                setPageError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a table' />
              </SelectTrigger>
              <SelectContent>
                {(floorMapQuery.data?.tables ?? []).map((table) => (
                  <SelectItem
                    key={table.id}
                    value={table.id}
                  >
                    {table.tableNumber} • seats {table.capacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2'>
            <Label>Open table tab</Label>
            {!selectedTableId ? (
              <p className='text-muted-foreground text-sm'>Select a table to view its open tab.</p>
            ) : openOrdersQuery.isPending ? (
              <p className='text-muted-foreground text-sm'>Loading open tab...</p>
            ) : activeTableOrder ? (
              <div className='space-y-2 rounded-md border p-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Items on tab</span>
                  <span className='font-medium'>{activeTableOrder.orderItems.length}</span>
                </div>
                <div className='space-y-1'>
                  {activeTableOrder.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between gap-3 text-sm'
                    >
                      <span>
                        x{item.quantity} {item.menuItem.name}
                      </span>
                      <Badge
                        variant={item.status === 'completed' ? 'default' : 'secondary'}
                        className='uppercase'
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className='flex items-center justify-between border-t pt-2 text-sm'>
                  <span className='text-muted-foreground'>Tab total</span>
                  <span className='font-semibold'>{formatMoney(activeTableOrder.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No open tab for this table yet. Submit items to create one.
              </p>
            )}
          </div>

          <div className='grid gap-2'>
            <Label>Items to add</Label>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((lineItem) => {
                  const menuItem = menuItemsById[lineItem.menuItemId];

                  return (
                    <TableRow key={lineItem.menuItemId}>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{menuItem?.name ?? lineItem.menuItemId}</p>
                          <p className='text-muted-foreground text-xs'>
                            {menuItem ? formatMoney(menuItem.price) : 'Unknown item'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='icon-sm'
                            onClick={() =>
                              setLineItems((current) =>
                                current
                                  .map((item) =>
                                    item.menuItemId === lineItem.menuItemId
                                      ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                                      : item,
                                  )
                                  .filter((item) => item.quantity > 0),
                              )
                            }
                          >
                            <Minus className='size-4' />
                          </Button>
                          <span className='w-6 text-center text-sm'>{lineItem.quantity}</span>
                          <Button
                            variant='outline'
                            size='icon-sm'
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
                            <Plus className='size-4' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() =>
                            setLineItems((current) =>
                              current.filter((item) => item.menuItemId !== lineItem.menuItemId),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {lineItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className='text-muted-foreground py-6 text-center'
                    >
                      Add items from the menu to queue new items on this table tab.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {lineItems.map((lineItem) => (
            <div
              key={`${lineItem.menuItemId}-notes`}
              className='grid gap-2'
            >
              <Label>Special instructions • {menuItemsById[lineItem.menuItemId]?.name}</Label>
              <Textarea
                value={lineItem.specialInstructions ?? ''}
                onChange={(event) =>
                  setLineItems((current) =>
                    current.map((item) =>
                      item.menuItemId === lineItem.menuItemId
                        ? {
                            ...item,
                            specialInstructions: event.target.value,
                          }
                        : item,
                    ),
                  )
                }
                placeholder='Optional prep notes'
              />
            </div>
          ))}

          <div className='bg-background flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
            <span className='text-muted-foreground'>Pending add total</span>
            <span className='font-semibold'>{formatMoney(orderTotal)}</span>
          </div>

          {activeTableOrder && activeOrderIncompleteItemCount > 0 && (
            <p className='text-muted-foreground text-sm'>
              Cannot close order yet. {activeOrderIncompleteItemCount} item
              {activeOrderIncompleteItemCount === 1 ? '' : 's'} still placed.
            </p>
          )}

          {activeTableOrder && lineItems.length > 0 && (
            <p className='text-muted-foreground text-sm'>
              Submit or clear pending items before closing this order.
            </p>
          )}

          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}

          <div className='grid gap-2 sm:grid-cols-2'>
            <Button
              className='w-full'
              disabled={
                !selectedTableId ||
                lineItems.length === 0 ||
                createOrderMutation.isPending ||
                menuQuery.isPending
              }
              onClick={() =>
                createOrderMutation.mutate({
                  tableId: selectedTableId,
                  items: lineItems,
                })
              }
            >
              {createOrderMutation.isPending ? 'Submitting items...' : 'Add items to tab'}
            </Button>

            <Button
              className='w-full'
              variant='secondary'
              disabled={
                !activeTableOrder ||
                activeOrderIncompleteItemCount > 0 ||
                lineItems.length > 0 ||
                closeOrderMutation.isPending ||
                createOrderMutation.isPending
              }
              onClick={() => {
                if (!activeTableOrder) {
                  return;
                }

                closeOrderMutation.mutate(activeTableOrder.id);
              }}
            >
              {closeOrderMutation.isPending ? 'Closing order...' : 'Close order'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
