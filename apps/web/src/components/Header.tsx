import { UtensilsCrossed } from 'lucide-react';
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx';
import ThemeToggle from './ThemeToggle';
import { Link } from '@tanstack/react-router';

export default function Header() {
  return (
    <header className='bg-background/80 sticky top-0 z-50 border-b py-4 backdrop-blur-md'>
      <div className='container mx-auto flex h-14 items-center gap-6 px-4'>
        <Link
          to='/'
          className='text-foreground flex items-center gap-2 font-semibold no-underline'
        >
          <UtensilsCrossed className='text-primary size-8' />
          <span>Smart Dine</span>
        </Link>

        <nav className='hidden items-center gap-5 sm:flex'>
          <Link
            to='/'
            className='text-muted-foreground hover:text-foreground text-sm font-medium no-underline'
            activeProps={{
              className: 'text-foreground text-sm font-medium no-underline',
            }}
          >
            Home
          </Link>
        </nav>

        <div className='ml-auto flex items-center gap-4'>
          <ThemeToggle />
          <BetterAuthHeader />
        </div>
      </div>
    </header>
  );
}
