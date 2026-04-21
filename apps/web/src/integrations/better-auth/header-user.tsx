import { staffQueryOptions } from '#/lib/api/staff';
import { authClient } from '#/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarClock, LayoutDashboard, LogOut, Shield, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@smartdine/ui/components/avatar';
import { Button } from '@smartdine/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartdine/ui/components/dropdown-menu';
import { Skeleton } from '@smartdine/ui/components/skeleton';

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const userRole = session?.user.role;
  const isAuthenticated = Boolean(session?.user);

  const membershipsQuery = useQuery({
    ...staffQueryOptions.myRestaurants(),
    enabled: isAuthenticated,
  });

  const canAccessWorkspace =
    userRole === 'admin' || ((membershipsQuery.data?.length ?? 0) > 0 && isAuthenticated);
  const canAccessAdmin = userRole === 'admin';

  if (isPending) {
    return <Skeleton className='size-8 rounded-full' />;
  }

  if (session?.user) {
    const initials = session.user.name
      ? session.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full'
          >
            <Avatar>
              {session.user.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name}
                />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-52'
        >
          <DropdownMenuLabel className='flex flex-col gap-0.5'>
            <span className='font-medium'>{session.user.name}</span>
            <span className='text-muted-foreground text-xs font-normal'>{session.user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canAccessWorkspace && (
            <DropdownMenuItem asChild>
              <Link to='/workspace'>
                <LayoutDashboard className='mr-2 size-4' />
                Workspace
              </Link>
            </DropdownMenuItem>
          )}
          {canAccessAdmin && (
            <DropdownMenuItem asChild>
              <Link to='/admin'>
                <Shield className='mr-2 size-4' />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          {(canAccessWorkspace || canAccessAdmin) && <DropdownMenuSeparator />}
          <DropdownMenuItem asChild>
            <Link to='/me/reservations'>
              <CalendarClock className='mr-2 size-4' />
              Reservations
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => void authClient.signOut()}
          >
            <LogOut className='mr-2 size-4' />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      asChild
      size='sm'
    >
      <Link to='/sign-in'>
        <User className='mr-1.5 size-4' />
        Sign in
      </Link>
    </Button>
  );
}
