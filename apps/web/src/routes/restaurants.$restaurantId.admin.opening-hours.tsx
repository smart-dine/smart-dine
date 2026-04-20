import { restaurantsQueryOptions, updateRestaurant } from '#/lib/api/restaurants';
import type { OpeningHours } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
import { queryKeys } from '#/lib/api/query-keys';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
import { Label } from '@smartdine/ui/components/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type DayHours = OpeningHours[DayKey];

const orderedDays: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const dayLabels: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const buildDefaultOpeningHours = (): OpeningHours => ({
  monday: { opens: '09:00', closes: '22:00', isClosed: false },
  tuesday: { opens: '09:00', closes: '22:00', isClosed: false },
  wednesday: { opens: '09:00', closes: '22:00', isClosed: false },
  thursday: { opens: '09:00', closes: '22:00', isClosed: false },
  friday: { opens: '09:00', closes: '22:00', isClosed: false },
  saturday: { opens: '09:00', closes: '22:00', isClosed: false },
  sunday: { opens: '09:00', closes: '22:00', isClosed: false },
});

const normalizeDayHours = (value: Partial<DayHours> | undefined, fallback: DayHours): DayHours => ({
  opens: typeof value?.opens === 'string' ? value.opens : fallback.opens,
  closes: typeof value?.closes === 'string' ? value.closes : fallback.closes,
  isClosed: typeof value?.isClosed === 'boolean' ? value.isClosed : fallback.isClosed,
});

const normalizeOpeningHours = (openingHours: OpeningHours | null | undefined): OpeningHours => {
  const fallback = buildDefaultOpeningHours();

  if (!openingHours || typeof openingHours !== 'object') {
    return fallback;
  }

  const source = openingHours as Partial<Record<DayKey, Partial<DayHours>>>;

  return {
    monday: normalizeDayHours(source.monday, fallback.monday),
    tuesday: normalizeDayHours(source.tuesday, fallback.tuesday),
    wednesday: normalizeDayHours(source.wednesday, fallback.wednesday),
    thursday: normalizeDayHours(source.thursday, fallback.thursday),
    friday: normalizeDayHours(source.friday, fallback.friday),
    saturday: normalizeDayHours(source.saturday, fallback.saturday),
    sunday: normalizeDayHours(source.sunday, fallback.sunday),
  };
};

export const Route = createFileRoute('/restaurants/$restaurantId/admin/opening-hours')({
  component: RestaurantAdminOpeningHoursPage,
});

function RestaurantAdminOpeningHoursPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();

  const restaurantQuery = useQuery(restaurantsQueryOptions.detail(restaurantId));

  const [draftOpeningHours, setDraftOpeningHours] = useState<OpeningHours | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantQuery.data?.openingHours) {
      return;
    }

    setDraftOpeningHours(normalizeOpeningHours(restaurantQuery.data.openingHours));
  }, [restaurantQuery.data?.openingHours]);

  const updateMutation = useMutation({
    mutationFn: (openingHours: OpeningHours) => updateRestaurant(restaurantId, { openingHours }),
    onSuccess: async (restaurant) => {
      setPageError(null);
      setPageNotice('Opening hours updated successfully.');
      setDraftOpeningHours(normalizeOpeningHours(restaurant.openingHours));

      await queryClient.invalidateQueries({
        queryKey: queryKeys.restaurants.detail(restaurantId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.restaurants.floorMap(restaurantId),
      });
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'list'],
      });
    },
    onError: (error) => {
      setPageNotice(null);
      setPageError(getApiErrorMessage(error, 'Failed to update opening hours.'));
    },
  });

  const updateDay = (day: DayKey, changes: Partial<DayHours>) => {
    setDraftOpeningHours((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [day]: {
          ...current[day],
          ...changes,
        },
      };
    });
    setPageError(null);
    setPageNotice(null);
  };

  if (restaurantQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading opening hours</CardTitle>
          <CardDescription>Fetching restaurant schedule settings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!restaurantQuery.data || !draftOpeningHours) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restaurant unavailable</CardTitle>
          <CardDescription>Unable to load this restaurant schedule.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='inline-flex items-center gap-2'>
          <Clock3 className='size-4' />
          Opening Hours
        </CardTitle>
        <CardDescription>
          Set weekly operating times used by reservation availability checks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();

            updateMutation.mutate(draftOpeningHours);
          }}
        >
          <div className='space-y-3'>
            {orderedDays.map((day) => {
              const dayHours = draftOpeningHours[day];

              return (
                <div
                  key={day}
                  className='rounded-lg border p-4'
                >
                  <div className='mb-3 flex items-center justify-between gap-4'>
                    <p className='font-medium'>{dayLabels[day]}</p>
                    <label className='inline-flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={dayHours.isClosed}
                        disabled={updateMutation.isPending}
                        onChange={(event) =>
                          updateDay(day, {
                            isClosed: event.target.checked,
                          })
                        }
                      />
                      Closed all day
                    </label>
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='grid gap-2'>
                      <Label htmlFor={`${day}-opens`}>Opens</Label>
                      <Input
                        id={`${day}-opens`}
                        type='time'
                        value={dayHours.opens}
                        disabled={dayHours.isClosed || updateMutation.isPending}
                        required
                        onChange={(event) =>
                          updateDay(day, {
                            opens: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className='grid gap-2'>
                      <Label htmlFor={`${day}-closes`}>Closes</Label>
                      <Input
                        id={`${day}-closes`}
                        type='time'
                        value={dayHours.closes}
                        disabled={dayHours.isClosed || updateMutation.isPending}
                        required
                        onChange={(event) =>
                          updateDay(day, {
                            closes: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='flex items-center gap-3'>
            <Button
              type='submit'
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save opening hours'}
            </Button>

            {pageNotice && <p className='text-sm text-emerald-700'>{pageNotice}</p>}
          </div>

          {pageError && <p className='text-destructive text-sm'>{pageError}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
