import { useAuthSession } from '#/lib/auth/access';
import { Button } from '@smartdine/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@smartdine/ui/components/card';
import { Link, Navigate, Outlet, createFileRoute } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useAuthSession();

  if (isPending) {
    return (
      <main className='container mx-auto px-4 py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Checking access</CardTitle>
            <CardDescription>Loading your admin session.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <Navigate
        to='/sign-in'
        replace
      />
    );
  }

  if (session.user.role !== 'admin') {
    return (
      <Navigate
        to='/'
        replace
      />
    );
  }

  return (
    <main className='container mx-auto flex flex-col gap-6 px-4 py-8'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between'>
        <div className='space-y-2'>
          <div className='text-primary inline-flex items-center gap-2 text-sm font-medium'>
            <ShieldCheck className='size-4' />
            Site Administration
          </div>
          <h1 className='text-3xl font-semibold tracking-tight'>Platform control center</h1>
          <p className='text-muted-foreground max-w-2xl'>
            Manage restaurants, assign owners, and review the full account directory from one place.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            asChild
            variant='outline'
          >
            <Link to='/admin'>Overview</Link>
          </Button>
          <Button
            asChild
            variant='outline'
          >
            <Link to='/admin/users'>Users</Link>
          </Button>
          <Button
            asChild
            variant='outline'
          >
            <Link to='/admin/restaurants'>Restaurants</Link>
          </Button>
        </div>
      </section>

      <Outlet />
    </main>
  );
}
