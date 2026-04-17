import {
  adminQueryOptions,
  createAdminRestaurant,
  deleteAdminRestaurant,
  updateRestaurantOwner,
} from '#/lib/api/admin';
import type { CreateAdminRestaurantInput, OpeningHours } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
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
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Plus, Trash2, UserRoundCog } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/admin/restaurants')({
  component: AdminRestaurantsPage,
});

const buildDefaultOpeningHours = (): OpeningHours => ({
  monday: { opens: '09:00', closes: '22:00', isClosed: false },
  tuesday: { opens: '09:00', closes: '22:00', isClosed: false },
  wednesday: { opens: '09:00', closes: '22:00', isClosed: false },
  thursday: { opens: '09:00', closes: '22:00', isClosed: false },
  friday: { opens: '09:00', closes: '22:00', isClosed: false },
  saturday: { opens: '09:00', closes: '22:00', isClosed: false },
  sunday: { opens: '09:00', closes: '22:00', isClosed: false },
});

const buildDefaultCreateState = (): CreateAdminRestaurantInput => ({
  name: '',
  description: '',
  address: '',
  phone: '',
  ownerUserId: '',
  openingHours: buildDefaultOpeningHours(),
  images: [],
});

function AdminRestaurantsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminRestaurantInput>(buildDefaultCreateState);
  const [ownerDraftByRestaurantId, setOwnerDraftByRestaurantId] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const restaurantsQuery = useQuery(adminQueryOptions.restaurants());
  const usersQuery = useQuery(
    adminQueryOptions.users({
      offset: 0,
      limit: 100,
    }),
  );

  const createMutation = useMutation({
    mutationFn: createAdminRestaurant,
    onSuccess: async () => {
      setCreateForm(buildDefaultCreateState());
      setCreateDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ['admin'],
      });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Failed to create restaurant.'));
    },
  });

  const assignOwnerMutation = useMutation({
    mutationFn: ({ restaurantId, ownerUserId }: { restaurantId: string; ownerUserId: string }) =>
      updateRestaurantOwner(restaurantId, { ownerUserId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'restaurants'],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminRestaurant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'restaurants'],
      });
    },
  });

  const users = usersQuery.data ?? [];
  const restaurants = restaurantsQuery.data ?? [];

  const ownerLookup = useMemo(() => {
    const map = new Map<string, string>();

    for (const restaurant of restaurants) {
      const ownerId = restaurant.staffRoles.find((role) => role.role === 'owner')?.userId;
      if (ownerId) {
        map.set(restaurant.id, ownerId);
      }
    }

    return map;
  }, [restaurants]);

  return (
    <Card>
      <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <CardTitle className='inline-flex items-center gap-2'>
            <Building2 className='size-4' />
            Restaurants
          </CardTitle>
          <CardDescription>Create venues, assign owners, and remove deprecated records.</CardDescription>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-1 size-4' />
              New restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>Create Restaurant</DialogTitle>
              <DialogDescription>
                This will create the restaurant and assign an owner staff role immediately.
              </DialogDescription>
            </DialogHeader>

            <form
              className='grid gap-4'
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                createMutation.mutate(createForm);
              }}
            >
              <div className='grid gap-2'>
                <Label htmlFor='restaurant-name'>Name</Label>
                <Input
                  id='restaurant-name'
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
                <Label htmlFor='restaurant-description'>Description</Label>
                <Textarea
                  id='restaurant-description'
                  value={createForm.description ?? ''}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder='Optional short summary'
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='restaurant-address'>Address</Label>
                <Input
                  id='restaurant-address'
                  value={createForm.address}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='restaurant-phone'>Phone</Label>
                <Input
                  id='restaurant-phone'
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label>Owner</Label>
                <Select
                  value={createForm.ownerUserId}
                  onValueChange={(value) =>
                    setCreateForm((current) => ({
                      ...current,
                      ownerUserId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Choose owner user' />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                      >
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formError && <p className='text-destructive text-sm'>{formError}</p>}

              <DialogFooter>
                <Button
                  type='submit'
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create restaurant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {restaurantsQuery.isPending ? (
          <p className='text-muted-foreground text-sm'>Loading restaurants...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant) => {
                const currentOwnerId = ownerLookup.get(restaurant.id) ?? '';
                const selectedOwnerId = ownerDraftByRestaurantId[restaurant.id] ?? currentOwnerId;

                return (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div>
                        <p className='font-medium'>{restaurant.name}</p>
                        <p className='text-muted-foreground text-xs'>{restaurant.id}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='grid gap-2'>
                        <Select
                          value={selectedOwnerId}
                          onValueChange={(value) =>
                            setOwnerDraftByRestaurantId((current) => ({
                              ...current,
                              [restaurant.id]: value,
                            }))
                          }
                        >
                          <SelectTrigger className='min-w-60'>
                            <SelectValue placeholder='Select owner' />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem
                                key={user.id}
                                value={user.id}
                              >
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant='outline'
                          size='sm'
                          className='w-fit'
                          disabled={
                            !selectedOwnerId ||
                            selectedOwnerId === currentOwnerId ||
                            assignOwnerMutation.isPending
                          }
                          onClick={() =>
                            assignOwnerMutation.mutate({
                              restaurantId: restaurant.id,
                              ownerUserId: selectedOwnerId,
                            })
                          }
                        >
                          <UserRoundCog className='mr-1 size-4' />
                          Assign owner
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className='text-muted-foreground text-sm'>{restaurant.address}</TableCell>

                    <TableCell className='text-right'>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          const shouldDelete = window.confirm(
                            `Delete ${restaurant.name}? This cannot be undone.`,
                          );

                          if (shouldDelete) {
                            deleteMutation.mutate(restaurant.id);
                          }
                        }}
                      >
                        <Trash2 className='mr-1 size-4' />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-8 text-center'
                  >
                    <Badge variant='secondary'>No restaurants yet</Badge>
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
