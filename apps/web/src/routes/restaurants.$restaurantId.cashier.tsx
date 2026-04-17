import { useRestaurantRouteAccess } from '#/lib/auth/access';
import type { CreateOrderItemInput, RestaurantMenuItem } from '#/lib/api/contracts';
import { createRestaurantOrder } from '#/lib/api/orders';
import { restaurantsQueryOptions } from '#/lib/api/restaurants';
import { getApiErrorMessage } from '#/lib/api/http';
import { formatMoney } from '#/lib/formatters';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
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
import { Minus, Plus, ShoppingBasket } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CashierLineItem extends CreateOrderItemInput {}

export const Route = createFileRoute('/restaurants/$restaurantId/cashier')({
  component: CashierPage,
});

function CashierPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const access = useRestaurantRouteAccess(restaurantId, 'cashier');

  const menuQuery = useQuery(restaurantsQueryOptions.menu(restaurantId));
  const floorMapQuery = useQuery(restaurantsQueryOptions.floorMap(restaurantId));

  const [selectedTableId, setSelectedTableId] = useState('');
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

  const menuItems = useMemo(
    () => (menuQuery.data ?? []).filter((item) => item.isAvailable),
    [menuQuery.data],
  );

  const menuItemsById = useMemo(
    () =>
      menuItems.reduce<Record<string, RestaurantMenuItem>>((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [menuItems],
  );

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
            </Link>
            .
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-3'>
          {menuQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading available menu items...</p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {menuItems.map((menuItem) => (
                <div
                  key={menuItem.id}
                  className='rounded-xl border bg-background p-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='font-medium'>{menuItem.name}</p>
                      <p className='text-muted-foreground text-xs'>
                        {menuItem.description || 'No description'}
                      </p>
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
              onValueChange={setSelectedTableId}
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
                    Add items from the menu to start an order.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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

          <div className='flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm'>
            <span className='text-muted-foreground'>Order total</span>
            <span className='font-semibold'>{formatMoney(orderTotal)}</span>
          </div>

          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}

          <Button
            className='w-full'
            disabled={
              !selectedTableId || lineItems.length === 0 || createOrderMutation.isPending || menuQuery.isPending
            }
            onClick={() =>
              createOrderMutation.mutate({
                tableId: selectedTableId,
                items: lineItems,
              })
            }
          >
            {createOrderMutation.isPending ? 'Submitting order...' : 'Submit order'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
