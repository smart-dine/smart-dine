import {
  replaceFloorPlan,
  restaurantsQueryOptions,
  toReplaceFloorPlanInput,
} from '#/lib/api/restaurants';
import type { FloorPlanTableInput, TableShape } from '#/lib/api/contracts';
import { getApiErrorMessage } from '#/lib/api/http';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const tableShapes: TableShape[] = ['round', 'rectangle'];

export const Route = createFileRoute('/restaurants/$restaurantId/admin/floor-plan')({
  component: RestaurantFloorPlanPage,
});

function RestaurantFloorPlanPage() {
  const queryClient = useQueryClient();
  const { restaurantId } = Route.useParams();
  const floorMapQuery = useQuery(restaurantsQueryOptions.floorMap(restaurantId));

  const [tables, setTables] = useState<FloorPlanTableInput[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!floorMapQuery.data) {
      return;
    }

    setTables(
      floorMapQuery.data.tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: Number(table.capacity),
        xCoordinate: Number(table.xCoordinate),
        yCoordinate: Number(table.yCoordinate),
        shape: table.shape as TableShape,
      })),
    );
  }, [floorMapQuery.data]);

  const replaceMutation = useMutation({
    mutationFn: (nextTables: FloorPlanTableInput[]) =>
      replaceFloorPlan(restaurantId, toReplaceFloorPlanInput(nextTables)),
    onSuccess: async () => {
      setPageError(null);
      await queryClient.invalidateQueries({
        queryKey: ['restaurants', 'floor-map', restaurantId],
      });
    },
    onError: (error) => {
      setPageError(getApiErrorMessage(error, 'Failed to save floor plan.'));
    },
  });

  const updateTable = <T extends keyof FloorPlanTableInput>(
    index: number,
    field: T,
    value: FloorPlanTableInput[T],
  ) => {
    setTables((current) =>
      current.map((table, tableIndex) =>
        tableIndex === index
          ? {
              ...table,
              [field]: value,
            }
          : table,
      ),
    );
  };

  return (
    <Card>
      <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <CardTitle className='inline-flex items-center gap-2'>
            <LayoutGrid className='size-4' />
            Floor Plan
          </CardTitle>
          <CardDescription>
            Edit table metadata and save as a full replacement payload to the API.
          </CardDescription>
        </div>

        <Button
          variant='outline'
          onClick={() =>
            setTables((current) => [
              ...current,
              {
                tableNumber: `T-${current.length + 1}`,
                capacity: 2,
                xCoordinate: 0,
                yCoordinate: 0,
                shape: 'round',
              },
            ])
          }
        >
          <Plus className='mr-1 size-4' />
          Add table
        </Button>
      </CardHeader>

      <CardContent className='space-y-4'>
        {floorMapQuery.isPending ? (
          <p className='text-muted-foreground text-sm'>Loading floor plan...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>X</TableHead>
                <TableHead>Y</TableHead>
                <TableHead>Shape</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table, index) => (
                <TableRow key={table.id ?? `new-${index}`}>
                  <TableCell>
                    <div className='grid gap-1'>
                      <Label className='text-xs'>Table Number</Label>
                      <Input
                        value={table.tableNumber}
                        onChange={(event) => updateTable(index, 'tableNumber', event.target.value)}
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Input
                      type='number'
                      min='1'
                      value={table.capacity}
                      onChange={(event) =>
                        updateTable(index, 'capacity', Number(event.target.value))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type='number'
                      min='0'
                      value={table.xCoordinate}
                      onChange={(event) =>
                        updateTable(index, 'xCoordinate', Number(event.target.value))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type='number'
                      min='0'
                      value={table.yCoordinate}
                      onChange={(event) =>
                        updateTable(index, 'yCoordinate', Number(event.target.value))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Select
                      value={table.shape}
                      onValueChange={(value) => updateTable(index, 'shape', value as TableShape)}
                    >
                      <SelectTrigger className='w-36'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tableShapes.map((shape) => (
                          <SelectItem
                            key={shape}
                            value={shape}
                          >
                            {shape}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className='text-right'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() =>
                        setTables((current) =>
                          current.filter((_, tableIndex) => tableIndex !== index),
                        )
                      }
                    >
                      <Trash2 className='mr-1 size-4' />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {tables.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground py-8 text-center'
                  >
                    Add your first table to start mapping the restaurant layout.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {pageError && <p className='text-destructive text-sm'>{pageError}</p>}

        <div className='flex justify-end'>
          <Button
            disabled={replaceMutation.isPending}
            onClick={() => replaceMutation.mutate(tables)}
          >
            {replaceMutation.isPending ? 'Saving...' : 'Save floor plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
