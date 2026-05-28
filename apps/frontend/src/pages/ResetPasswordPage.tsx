import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ResetPasswordFormSchema } from '@notepad/shared';
import type { ResetPasswordFormDto } from '@notepad/shared';
import { useResetPassword } from '@/hooks/useResetPassword';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const form = useForm<ResetPasswordFormDto>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      email: email ?? '',
      otp: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  function onSubmit({ email: em, otp, newPassword }: ResetPasswordFormDto) {
    resetPassword(
      { email: em, otp, newPassword },
      {
        onSuccess: () =>
          navigate('/login', {
            replace: true,
            state: { message: 'Password reset successful. Please sign in.' },
          }),
      },
    );
  }

  const apiError = error as (Error & { status?: number }) | null;
  const errorMessage = apiError
    ? apiError.status === 400
      ? 'OTP is invalid or has expired.'
      : 'Something went wrong. Please try again.'
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter the 6-digit code sent to <strong>{email}</strong> and your new password.
          </p>
          {errorMessage && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Resetting password…' : 'Reset password'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
              Request a new code
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
