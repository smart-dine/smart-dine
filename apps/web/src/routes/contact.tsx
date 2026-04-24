import { Button } from '@smartdine/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Users, Utensils, Zap, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/contact')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className='bg-background flex min-h-screen w-full flex-col overflow-hidden'>
      {/* HERO SECTION 
        Uses massive py-32 padding and flex-col with gap-8 to ensure nothing overlaps.
      */}
      <section className='relative flex w-full flex-col items-center justify-center px-6 py-32 md:py-48'>
        {/* Decorative Background Gradients */}
        <div className='from-primary/10 via-background to-background absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))]' />

        <div className='flex max-w-4xl flex-col items-center gap-8 text-center'>
          <div className='bg-background/50 text-primary inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium shadow-sm backdrop-blur-sm'>
            <Sparkles className='size-4' />
            <span>The Future of Dining</span>
          </div>

          <h1 className='text-foreground text-5xl font-extrabold tracking-tight text-balance sm:text-6xl md:text-7xl'>
            Connecting{' '}
            <span className='from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent'>
              Diners
            </span>{' '}
            and Restaurants
          </h1>

          <p className='text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance md:text-xl'>
            Smart Dine is the unified platform eliminating friction from both sides of the table.
            Search, book, and manage your restaurant with a single, seamless ecosystem.
          </p>
        </div>
      </section>

      {/* FEATURES GRID
        Strict grid layout with gap-8. Uses Shadcn Card components natively for perfect internal padding.
      */}
      <section className='bg-muted/30 w-full border-y px-6 py-24'>
        <div className='container mx-auto flex flex-col gap-16'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <h2 className='text-foreground text-3xl font-bold tracking-tight md:text-4xl'>
              The Smart Dine Advantage
            </h2>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Designed for customers to discover effortlessly, built for restaurants to operate
              flawlessly.
            </p>
          </div>

          <div className='grid w-full grid-cols-1 gap-8 md:grid-cols-3'>
            <Card className='border-border/50 bg-background flex flex-col shadow-sm transition-all hover:shadow-md'>
              <CardHeader className='gap-4 pb-4'>
                <div className='bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl'>
                  <Users className='size-7' />
                </div>
                <CardTitle className='text-xl'>Customer-Centric</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-muted-foreground text-base leading-relaxed'>
                  Intuitive booking flow with real-time availability and interactive floor plan
                  selection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='border-border/50 bg-background flex flex-col shadow-sm transition-all hover:shadow-md'>
              <CardHeader className='gap-4 pb-4'>
                <div className='bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl'>
                  <Utensils className='size-7' />
                </div>
                <CardTitle className='text-xl'>Complete Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-muted-foreground text-base leading-relaxed'>
                  Reservations, orders, staff workflows, and dynamic menus—all centralized in one
                  platform.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='border-border/50 bg-background flex flex-col shadow-sm transition-all hover:shadow-md'>
              <CardHeader className='gap-4 pb-4'>
                <div className='bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl'>
                  <Zap className='size-7' />
                </div>
                <CardTitle className='text-xl'>Universal System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-muted-foreground text-base leading-relaxed'>
                  Staff trained on Smart Dine once can work anywhere—reducing onboarding time and
                  overhead costs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SPLIT SECTION
        Uses a 12-column grid. Col-span-7 for text, col-span-5 for cards. 
        Massive gap-16 to ensure they never touch.
      */}
      <section className='w-full px-6 py-24 md:py-32'>
        <div className='container mx-auto grid w-full grid-cols-1 items-start gap-16 lg:grid-cols-12 lg:gap-24'>
          {/* Left Column - Vision & About */}
          <div className='flex flex-col gap-12 lg:col-span-7'>
            <div className='flex flex-col gap-6'>
              <h2 className='text-foreground text-4xl font-extrabold tracking-tight'>Our Vision</h2>
              <p className='text-muted-foreground text-xl leading-relaxed'>
                We envision a world where finding, booking, and enjoying restaurant experiences is
                effortless, allowing restaurants to focus on what they do best—delivering
                exceptional food and service.
              </p>
            </div>

            <div className='border-border/50 bg-muted/30 flex flex-col gap-8 rounded-2xl border p-8 md:p-10'>
              <div className='flex flex-col gap-4'>
                <h3 className='text-foreground flex items-center gap-3 text-xl font-semibold'>
                  <CheckCircle2 className='text-primary size-6' />
                  For Customers
                </h3>
                <p className='text-muted-foreground text-lg leading-relaxed'>
                  Smart Dine is your personal guide. Search restaurants in seconds, check real-time
                  availability, browse menus, and secure your perfect table without juggling
                  multiple apps.
                </p>
              </div>

              <div className='bg-border/50 h-px w-full' />

              <div className='flex flex-col gap-4'>
                <h3 className='text-foreground flex items-center gap-3 text-xl font-semibold'>
                  <CheckCircle2 className='text-primary size-6' />
                  For Restaurant Staff
                </h3>
                <p className='text-muted-foreground text-lg leading-relaxed'>
                  It's an all-in-one hub. Whether managing reservations or coordinating the kitchen,
                  everything is optimized. Plus, our standardized interface means cross-training is
                  virtually eliminated.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Contact CTAs */}
          <div className='sticky top-32 flex flex-col gap-8 lg:col-span-5'>
            {/* Main Contact Card */}
            <Card className='border-primary/20 shadow-primary/5 overflow-hidden shadow-2xl'>
              <div className='from-primary to-primary/60 h-2 w-full bg-linear-to-r' />
              <CardHeader className='gap-2 pt-8'>
                <div className='bg-primary/10 mb-2 flex size-16 items-center justify-center rounded-full'>
                  <Mail className='text-primary size-8' />
                </div>
                <CardTitle className='text-3xl font-bold'>Ready to Partner?</CardTitle>
                <CardDescription className='text-muted-foreground text-base'>
                  Bring your restaurant to Smart Dine and reach thousands of diners.
                </CardDescription>
              </CardHeader>

              <CardContent className='flex flex-col gap-8 pb-8'>
                <div className='bg-muted/50 flex flex-col gap-4 rounded-xl p-6'>
                  <p className='text-foreground font-medium'>Please include in your email:</p>
                  <ul className='text-muted-foreground flex flex-col gap-3 text-sm'>
                    <li className='flex items-center gap-2'>
                      <div className='bg-primary/50 size-1.5 rounded-full' />
                      Restaurant name and location
                    </li>
                    <li className='flex items-center gap-2'>
                      <div className='bg-primary/50 size-1.5 rounded-full' />
                      Brief description of your cuisine
                    </li>
                    <li className='flex items-center gap-2'>
                      <div className='bg-primary/50 size-1.5 rounded-full' />
                      Seating capacity
                    </li>
                  </ul>
                </div>

                <Button
                  size='lg'
                  className='h-14 w-full text-base font-semibold shadow-xl'
                  asChild
                >
                  <a href='mailto:smartdine@hrustinszki.com'>
                    Contact Partnerships
                    <ArrowRight className='ml-2 size-5' />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Support Card */}
            <Card className='border-border/50 bg-background/50 backdrop-blur-sm'>
              <CardContent className='flex flex-col items-center justify-between gap-4 p-6 sm:flex-row'>
                <div className='flex flex-col text-center sm:text-left'>
                  <h3 className='text-foreground font-semibold'>Quick Inquiries</h3>
                  <p className='text-muted-foreground text-sm'>Response within 24 hours</p>
                </div>
                <a
                  href='mailto:smartdine@hrustinszki.com'
                  className='bg-muted text-primary hover:bg-primary/10 rounded-md px-4 py-2 font-medium transition-colors'
                >
                  Email Us
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
