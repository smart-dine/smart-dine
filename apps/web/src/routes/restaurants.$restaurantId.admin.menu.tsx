import {
  createMenuItem,
  deleteMenuItem,
  restaurantsQueryOptions,
  updateMenuItem,
  uploadMenuItemImage,
} from '#/lib/api/restaurants';
import type { RestaurantMenuItem } from '#/lib/api/contracts';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@smartdine/ui/components/dialog';
import { Input } from '@smartdine/ui/components/input';
import { Label } from '@smartdine/ui/components/label';
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
import { createFileRoute } from '@tanstack/react-router';
import { ImageUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MenuFormState {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
}

export const Route = createFileRoute('/restaurants/$restaurantId/admin/menu')({
  component: RestaurantMenuPage,
});

const toMinorUnits = (value: string) => Math.round(Number(value) * 100);

const createDefaultFormState = (): MenuFormState => ({
  name: '',
  description: '',
  price: '',
  isAvailable: true,
});

function RestaurantMenuPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();

  const [createForm, setCreateForm] = useState<MenuFormState>(createDefaultFormState);
  const [editingItem, setEditingItem] = useState<RestaurantMenuItem | null>(null);
  const [editForm, setEditForm] = useState<MenuFormState>(createDefaultFormState);
  const [pageError, setPageError] = useState<string | null>(null);

  const menuQuery = useQuery(restaurantsQueryOptions.menu(restaurantId));

  const invalidateMenu = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['restaurants', 'menu', restaurantId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['restaurants', 'detail', restaurantId],
    });
  };

  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: async () => {
      setCreateForm(createDefaultFormState());
      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to create menu item.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMenuItem,
    onSuccess: async () => {
      setEditingItem(null);
      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to update menu item.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: async () => {
      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to delete menu item.'));
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ menuItemId, file }: { menuItemId: string; file: File }) =>
      uploadMenuItemImage(restaurantId, menuItemId, file),
    onSuccess: async () => {
      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to upload menu image.'));
    },
  });

  const menuItems = menuQuery.data ?? [];

  return (
    <div className='grid gap-4 lg:grid-cols-[1.05fr_1.95fr]'>
      <Card>
        <CardHeader>
          <CardTitle className='inline-flex items-center gap-2'>
            <Plus className='size-4' />
            Add Menu Item
          </CardTitle>
          <CardDescription>Create new dishes and set initial availability.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='space-y-3'
            onSubmit={(event) => {
              event.preventDefault();

              createMutation.mutate({
                restaurantId,
                input: {
                  name: createForm.name,
                  description: createForm.description || undefined,
                  price: toMinorUnits(createForm.price),
                  isAvailable: createForm.isAvailable,
                },
              });
            }}
          >
            <div className='grid gap-2'>
              <Label htmlFor='menu-item-name'>Name</Label>
              <Input
                id='menu-item-name'
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='menu-item-description'>Description</Label>
              <Textarea
                id='menu-item-description'
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='menu-item-price'>Price (USD)</Label>
              <Input
                id='menu-item-price'
                type='number'
                min='0'
                step='0.01'
                value={createForm.price}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                required
              />
            </div>

            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={createForm.isAvailable}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    isAvailable: event.target.checked,
                  }))
                }
              />
              Available for ordering
            </label>

            <Button
              type='submit'
              className='w-full'
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create item'}
            </Button>
          </form>

          {pageError && <p className='text-destructive mt-3 text-sm'>{pageError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Catalog</CardTitle>
          <CardDescription>
            Update pricing, availability, imagery, and item definitions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menuQuery.isPending ? (
            <p className='text-muted-foreground text-sm'>Loading menu...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='space-y-1'>
                        <p className='font-medium'>{item.name}</p>
                        <p className='text-muted-foreground text-xs'>
                          {item.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatMoney(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                        {item.isAvailable ? 'available' : 'hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Dialog
                          open={editingItem?.id === item.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingItem(null);
                              return;
                            }

                            setEditingItem(item);
                            setEditForm({
                              name: item.name,
                              description: item.description ?? '',
                              price: (item.price / 100).toFixed(2),
                              isAvailable: item.isAvailable,
                            });
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              <Pencil className='mr-1 size-4' />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='max-w-lg'>
                            <DialogHeader>
                              <DialogTitle>Edit {item.name}</DialogTitle>
                              <DialogDescription>
                                Update menu item details and pricing.
                              </DialogDescription>
                            </DialogHeader>

                            <form
                              className='space-y-3'
                              onSubmit={(event) => {
                                event.preventDefault();

                                updateMutation.mutate({
                                  restaurantId,
                                  menuItemId: item.id,
                                  input: {
                                    name: editForm.name,
                                    description: editForm.description || undefined,
                                    price: toMinorUnits(editForm.price),
                                    isAvailable: editForm.isAvailable,
                                  },
                                });
                              }}
                            >
                              <div className='grid gap-2'>
                                <Label>Name</Label>
                                <Input
                                  value={editForm.name}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      name: event.target.value,
                                    }))
                                  }
                                  required
                                />
                              </div>

                              <div className='grid gap-2'>
                                <Label>Description</Label>
                                <Textarea
                                  value={editForm.description}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      description: event.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div className='grid gap-2'>
                                <Label>Price (USD)</Label>
                                <Input
                                  type='number'
                                  min='0'
                                  step='0.01'
                                  value={editForm.price}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      price: event.target.value,
                                    }))
                                  }
                                  required
                                />
                              </div>

                              <label className='flex items-center gap-2 text-sm'>
                                <input
                                  type='checkbox'
                                  checked={editForm.isAvailable}
                                  onChange={(event) =>
                                    setEditForm((current) => ({
                                      ...current,
                                      isAvailable: event.target.checked,
                                    }))
                                  }
                                />
                                Available for ordering
                              </label>

                              <DialogFooter>
                                <Button
                                  type='submit'
                                  disabled={updateMutation.isPending}
                                >
                                  Save changes
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <label className='inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-sm'>
                          <ImageUp className='size-4' />
                          <input
                            type='file'
                            className='hidden'
                            accept='image/png,image/jpeg,image/webp'
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }

                              uploadImageMutation.mutate({
                                menuItemId: item.id,
                                file,
                              });
                            }}
                          />
                          Image
                        </label>

                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => {
                            const shouldDelete = window.confirm(
                              `Delete ${item.name}? This action cannot be undone.`,
                            );
                            if (shouldDelete) {
                              deleteMutation.mutate({
                                restaurantId,
                                menuItemId: item.id,
                              });
                            }
                          }}
                        >
                          <Trash2 className='mr-1 size-4' />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {menuItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-muted-foreground py-8 text-center'
                    >
                      No menu items yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
