import { staffQueryOptions } from '#/lib/api/staff';
import { authClient } from '#/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx';
import ThemeToggle from './ThemeToggle';
import { Link } from '@tanstack/react-router';

export default function Header() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userRole = session?.user.role;
  const isAuthenticated = Boolean(session?.user);

  const membershipsQuery = useQuery({
    ...staffQueryOptions.myRestaurants(),
    enabled: isAuthenticated,
  });

  const canAccessWorkspace =
    userRole === 'admin' || ((membershipsQuery.data?.length ?? 0) > 0 && isAuthenticated);
  const canAccessAdmin = userRole === 'admin';

  return (
    <header className='bg-background/80 sticky top-0 z-50 border-b py-4 backdrop-blur-md'>
      <div className='container mx-auto flex h-14 items-center gap-6 px-4'>
        <Link
          to='/'
          className='text-foreground flex items-center gap-2 font-semibold no-underline'
        >
          <img
            src='/logo.svg'
            alt='Smart Dine logo'
            className='size-8'
          />
          <span>Smart Dine</span>
        </Link>

        <nav className='hidden items-center gap-5 sm:flex'>
          <Link
            to='/'
            className='text-muted-foreground hover:text-foreground [&.active]:text-foreground text-sm font-medium no-underline underline-offset-8 [&.active]:font-semibold [&.active]:underline'
          >
            Landing
          </Link>

          {!sessionPending && canAccessWorkspace && (
            <Link
              to='/workspace'
              className='text-muted-foreground hover:text-foreground [&.active]:text-foreground text-sm font-medium no-underline underline-offset-8 [&.active]:font-semibold [&.active]:underline'
            >
              Workspace
            </Link>
          )}

          {!sessionPending && canAccessAdmin && (
            <Link
              to='/admin'
              className='text-muted-foreground hover:text-foreground [&.active]:text-foreground text-sm font-medium no-underline underline-offset-8 [&.active]:font-semibold [&.active]:underline'
            >
              Admin
            </Link>
          )}
        </nav>

        <div className='ml-auto flex items-center gap-4'>
          <ThemeToggle />
          <BetterAuthHeader />
        </div>
      </div>
    </header>
  );
}
