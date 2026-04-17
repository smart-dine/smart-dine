import { adminQueryOptions } from '#/lib/api/admin';
import { Badge } from '@smartdine/ui/components/badge';
import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Input } from '@smartdine/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@smartdine/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Search, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 20;

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);

  const query = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      offset,
      limit: PAGE_SIZE,
    }),
    [offset, searchTerm],
  );

  const usersQuery = useQuery(adminQueryOptions.users(query));
  const users = usersQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='inline-flex items-center gap-2'>
          <UserRound className='size-4' />
          User Directory
        </CardTitle>
        <CardDescription>
          Search and browse user accounts for owner assignment operations.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <form
          className='flex flex-col gap-2 md:flex-row'
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setSearchTerm(searchInput);
          }}
        >
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              className='pl-9'
              placeholder='Search by name or email'
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <Button type='submit'>Search</Button>
        </form>

        {usersQuery.isPending ? (
          <p className='text-muted-foreground text-sm'>Loading users...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.name || 'Unknown user'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>{user.id}</TableCell>
                </TableRow>
              ))}

              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-muted-foreground py-8 text-center'
                  >
                    No users found for this query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            disabled={offset === 0 || usersQuery.isPending}
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            disabled={users.length < PAGE_SIZE || usersQuery.isPending}
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
