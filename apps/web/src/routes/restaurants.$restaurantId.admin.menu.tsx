import {
  createRestaurantCategory,
  createMenuItem,
  deleteRestaurantCategory,
  deleteMenuItem,
  restaurantsQueryOptions,
  setMenuItemCategories,
  updateMenuItem,
  uploadMenuItemImage,
} from '#/lib/api/restaurants';
import type {
  CreateMenuItemInput,
  RestaurantMenuItemWithCategories,
  UpdateMenuItemInput,
} from '#/lib/api/contracts';
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
import { ImageUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface MenuFormState {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  selectedCategoryIds: Set<string>;
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
  selectedCategoryIds: new Set(),
});

function RestaurantMenuPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [createForm, setCreateForm] = useState<MenuFormState>(createDefaultFormState);
  const [editingItem, setEditingItem] = useState<RestaurantMenuItemWithCategories | null>(null);
  const [editForm, setEditForm] = useState<MenuFormState>(createDefaultFormState);
  const [pageError, setPageError] = useState<string | null>(null);

  const menuQuery = useQuery(restaurantsQueryOptions.menu(restaurantId));
  const categoriesQuery = useQuery(restaurantsQueryOptions.categories(restaurantId));

  const invalidateMenu = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['restaurants', 'menu', restaurantId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['restaurants', 'categories', restaurantId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['restaurants', 'detail', restaurantId],
    });
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateMenuItemInput) => {
      const created = await createMenuItem(restaurantId, input);
      // Set categories if any were selected
      if (createForm.selectedCategoryIds.size > 0) {
        await setMenuItemCategories(
          restaurantId,
          created.id,
          Array.from(createForm.selectedCategoryIds),
        );
      }
      return created;
    },
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
    mutationFn: async ({
      menuItemId,
      input,
    }: {
      menuItemId: string;
      input: UpdateMenuItemInput;
    }) => {
      await updateMenuItem(restaurantId, menuItemId, input);
      // Update categories
      await setMenuItemCategories(
        restaurantId,
        menuItemId,
        Array.from(editForm.selectedCategoryIds),
      );
    },
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
    mutationFn: (menuItemId: string) => deleteMenuItem(restaurantId, menuItemId),
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

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      createRestaurantCategory(restaurantId, {
        name,
      }),
    onSuccess: async () => {
      setNewCategoryName('');
      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to create category.'));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => deleteRestaurantCategory(restaurantId, categoryId),
    onSuccess: async (_deletedCategory, categoryId) => {
      setCreateForm((current) => {
        const next = new Set(current.selectedCategoryIds);
        next.delete(categoryId);
        return {
          ...current,
          selectedCategoryIds: next,
        };
      });
      setEditForm((current) => {
        const next = new Set(current.selectedCategoryIds);
        next.delete(categoryId);
        return {
          ...current,
          selectedCategoryIds: next,
        };
      });

      setPageError(null);
      await invalidateMenu();
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to delete category.'));
    },
  });

  const menuItems = menuQuery.data ?? [];
  const categoryOptions = categoriesQuery.data ?? [];

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
        <CardContent className='space-y-4'>
          <div className='space-y-3 rounded-lg border p-3'>
            <div>
              <p className='text-sm font-medium'>Category Manager</p>
              <p className='text-muted-foreground text-xs'>
                Add categories here, then assign them to menu items below.
              </p>
            </div>

            <form
              className='flex gap-2'
              onSubmit={(event) => {
                event.preventDefault();

                const trimmedName = newCategoryName.trim();
                if (!trimmedName) {
                  return;
                }

                createCategoryMutation.mutate(trimmedName);
              }}
            >
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder='e.g. Drinks, Alcoholic, Dessert'
                maxLength={80}
              />
              <Button
                type='submit'
                variant='secondary'
                disabled={createCategoryMutation.isPending || newCategoryName.trim().length === 0}
              >
                Add
              </Button>
            </form>

            {categoriesQuery.isPending ? (
              <p className='text-muted-foreground text-xs'>Loading categories...</p>
            ) : categoryOptions.length === 0 ? (
              <p className='text-muted-foreground text-xs'>No categories yet.</p>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {categoryOptions.map((category) => (
                  <Badge
                    key={category.id}
                    variant='outline'
                    className='inline-flex items-center gap-1 pr-1'
                  >
                    <span className='text-sm'>{category.name}</span>
                    <button
                      type='button'
                      className='hover:bg-muted rounded p-0.5'
                      aria-label={`Delete ${category.name} category`}
                      disabled={deleteCategoryMutation.isPending}
                      onClick={() => {
                        const shouldDelete = window.confirm(
                          `Delete ${category.name} category? It will be removed from all menu items.`,
                        );
                        if (shouldDelete) {
                          deleteCategoryMutation.mutate(category.id);
                        }
                      }}
                    >
                      <X className='size-2' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <form
            className='space-y-3'
            onSubmit={(event) => {
              event.preventDefault();

              createMutation.mutate({
                name: createForm.name,
                description: createForm.description || undefined,
                price: toMinorUnits(createForm.price),
                isAvailable: createForm.isAvailable,
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

            <div className='grid gap-2'>
              <Label>Categories</Label>
              {categoriesQuery.isPending ? (
                <p className='text-muted-foreground text-xs'>Loading categories...</p>
              ) : categoryOptions.length === 0 ? (
                <p className='text-muted-foreground text-xs'>
                  No categories yet. Add one in Category Manager above.
                </p>
              ) : (
                <div className='space-y-2'>
                  {categoryOptions.map((category) => (
                    <label
                      key={category.id}
                      className='flex items-center gap-2 text-sm'
                    >
                      <input
                        type='checkbox'
                        checked={createForm.selectedCategoryIds.has(category.id)}
                        onChange={(event) =>
                          setCreateForm((current) => {
                            const next = new Set(current.selectedCategoryIds);
                            if (event.target.checked) {
                              next.add(category.id);
                            } else {
                              next.delete(category.id);
                            }
                            return {
                              ...current,
                              selectedCategoryIds: next,
                            };
                          })
                        }
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

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
                        {item.categories.length > 0 && (
                          <div className='mt-2 flex flex-wrap gap-1'>
                            {item.categories.map((ic) => (
                              <Badge
                                key={ic.categoryId}
                                variant='outline'
                                className='text-xs'
                              >
                                {ic.category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
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
                              selectedCategoryIds: new Set(
                                item.categories.map((ic) => ic.categoryId),
                              ),
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

                              <div className='grid gap-2'>
                                <Label>Categories</Label>
                                {categoriesQuery.isPending ? (
                                  <p className='text-muted-foreground text-xs'>
                                    Loading categories...
                                  </p>
                                ) : categoryOptions.length === 0 ? (
                                  <p className='text-muted-foreground text-xs'>
                                    No categories yet. Add one in Category Manager.
                                  </p>
                                ) : (
                                  <div className='space-y-2'>
                                    {categoryOptions.map((category) => (
                                      <label
                                        key={category.id}
                                        className='flex items-center gap-2 text-sm'
                                      >
                                        <input
                                          type='checkbox'
                                          checked={editForm.selectedCategoryIds.has(category.id)}
                                          onChange={(event) =>
                                            setEditForm((current) => {
                                              const next = new Set(current.selectedCategoryIds);
                                              if (event.target.checked) {
                                                next.add(category.id);
                                              } else {
                                                next.delete(category.id);
                                              }
                                              return {
                                                ...current,
                                                selectedCategoryIds: next,
                                              };
                                            })
                                          }
                                        />
                                        {category.name}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

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
                              deleteMutation.mutate(item.id);
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
