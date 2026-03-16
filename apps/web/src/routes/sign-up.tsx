import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { authClient } from '#/lib/auth-client';
import { Button } from '@smartdine/ui/components/button';
import { Input } from '@smartdine/ui/components/input';
import { Label } from '@smartdine/ui/components/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@smartdine/ui/components/card';
import { Separator } from '@smartdine/ui/components/separator';

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError('');
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });
      if (error) {
        setServerError(error.message ?? 'Sign up failed. Please try again.');
      } else {
        await navigate({ to: '/' });
      }
    },
  });

  const handleOAuth = (provider: 'google' | 'github') => {
    void authClient.signIn.social({ provider, callbackURL: '/' });
  };

  return (
    <main className='flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-12'>
      <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>Create an account</CardTitle>
          <CardDescription>Sign up to get started</CardDescription>
        </CardHeader>

        <CardContent className='flex flex-col gap-4'>
          {/* OAuth */}
          <div className='flex flex-col gap-2'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => handleOAuth('google')}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => handleOAuth('github')}
            >
              <GitHubIcon />
              Continue with GitHub
            </Button>
          </div>

          <div className='flex items-center gap-3'>
            <Separator className='flex-1' />
            <span className='text-muted-foreground text-xs'>or</span>
            <Separator className='flex-1' />
          </div>

          {/* Email form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className='flex flex-col gap-4'
          >
            {serverError && (
              <p className='border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm'>
                {serverError}
              </p>
            )}

            <form.Field
              name='name'
              validators={{
                onBlur: ({ value }) => {
                  if (!value.trim()) return 'Name is required';
                  if (value.trim().length < 2) return 'Name must be at least 2 characters';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor={field.name}>Full name</Label>
                  <Input
                    id={field.name}
                    type='text'
                    placeholder='Your name'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-destructive text-xs'>{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name='email'
              validators={{
                onBlur: ({ value }) => {
                  if (!value) return 'Email is required';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    type='email'
                    placeholder='you@example.com'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className='text-destructive text-xs'>{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name='password'
              validators={{
                onBlur: ({ value }) => {
                  if (!value) return 'Password is required';
                  if (value.length < 8) return 'Password must be at least 8 characters';
                  if (!/[A-Z]/.test(value))
                    return 'Password must contain at least one uppercase letter';
                  if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    type='password'
                    placeholder='••••••••'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className='text-destructive text-xs'>{String(field.state.meta.errors[0])}</p>
                  ) : (
                    <p className='text-muted-foreground text-xs'>
                      Min. 8 characters, one uppercase letter and one number.
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type='submit'
                  className='w-full'
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>

        <CardFooter className='justify-center'>
          <p className='text-muted-foreground text-sm'>
            Already have an account?{' '}
            <Link
              to='/sign-in'
              className='text-primary font-medium underline-offset-4 hover:underline'
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      aria-hidden='true'
      className='mr-2'
    >
      <path
        fill='#4285F4'
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      />
      <path
        fill='#34A853'
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      />
      <path
        fill='#FBBC05'
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
      />
      <path
        fill='#EA4335'
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      aria-hidden='true'
      fill='currentColor'
      className='mr-2'
    >
      <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z' />
    </svg>
  );
}
