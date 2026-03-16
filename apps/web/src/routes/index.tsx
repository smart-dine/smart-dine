import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <main className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold'>Welcome to Smart Dine!</h1>
      <p className='text-muted-foreground mt-4 text-lg'>
        Explore our delicious menu and enjoy a seamless dining experience.
      </p>
    </main>
  );
}
