'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Spinner } from '@trifusion/ui';
import { AlertCircle, MailCheck } from 'lucide-react';
import { apiClient, ApiClientError } from '../../lib/api-client';
import { useAuth } from '../../contexts/auth-context';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get('email') ?? '');
  }, [searchParams]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await apiClient.auth.verifyEmail({ email: email.trim(), code: code.trim() });
      await refreshUser();
      router.replace('/dashboard');
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Email verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      const result = await apiClient.auth.resendVerification(email.trim());
      setMessage(result.message || 'A new verification code has been sent.');
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Could not resend the verification code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-muted shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>Enter the six-digit code sent to your email address.</CardDescription>
        </CardHeader>
        <form onSubmit={verify}>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            {message && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
            <div className="space-y-2">
              <Label htmlFor="verify-email">Email address</Label>
              <Input id="verify-email" type="email" required autoComplete="email" value={email} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-code">6-digit verification code</Label>
              <Input id="verification-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value.replace(/\\D/g, '').slice(0, 6))} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting || !email.trim() || code.length !== 6}>
              {submitting ? <><Spinner size="sm" className="mr-2" />Verifying…</> : 'Verify email'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={resending || !email.trim()}>
              {resending ? 'Sending…' : 'Resend verification code'}
            </Button>
            <p className="text-sm text-muted-foreground">Already verified? <Link className="font-semibold text-primary hover:underline" href="/login">Sign in</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Spinner size="large" /></div>}><VerifyEmailForm /></Suspense>;
}
