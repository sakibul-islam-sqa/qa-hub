'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Braces,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useAuth, authErrorMessage } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading, configured, signInWithEmail, signUpWithEmail, signInWithGoogle } =
    useAuth();

  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState<null | 'email' | 'google'>(null);

  React.useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('email');
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password);
        toast.success('Account created', {
          description: `Welcome to QA Hub, ${email.trim()}.`,
        });
      } else {
        await signInWithEmail(email.trim(), password);
        toast.success('Signed in', {
          description: 'Your tools and settings are ready.',
        });
      }
    } catch (err) {
      toast.error('Sign-in failed', { description: authErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    if (busy) return;
    setBusy('google');
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google', {
        description: 'Your tools and settings are ready.',
      });
    } catch (err) {
      toast.error('Google sign-in failed', { description: authErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  if (!configured) {
    return (
      <AuthShell>
        <Card className="w-full max-w-md">
          <CardContent className="space-y-3 p-6 text-sm">
            <h1 className="text-lg font-semibold">Firebase isn&rsquo;t configured</h1>
            <p className="text-muted">
              Copy <code className="rounded bg-surface-2 px-1">.env.local.example</code> to{' '}
              <code className="rounded bg-surface-2 px-1">.env.local</code> and fill in your
              Firebase web config, then restart the dev server.
            </p>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  const isSignup = mode === 'signup';
  const passwordValid = password.length >= 6;

  return (
    <AuthShell>
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        {/* Hero / branding panel - desktop only */}
        <aside className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent text-accent-fg shadow-glow">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-accent opacity-50 blur-md"
              />
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">QA Hub</span>
          </div>

          <h2 className="text-2xl font-bold leading-[1.1] tracking-tight xl:text-3xl">
            Every QA tool you need, <br />
            <span className="text-gradient">one workspace.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            AI test case &amp; bug report drafting, JSON / regex / encoding, diffs, test data,
            screenshot annotation, cURL ↔ fetch, color &amp; WCAG contrast - built for QA engineers,
            all in your browser.
          </p>

          <ul className="mt-8 space-y-3.5 text-sm">
            <Feature
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="AI test cases & bug reports - bring your own model"
            />
            <Feature
              icon={<Braces className="h-3.5 w-3.5" />}
              label="JSON, regex, encoding, diffs, test data & more"
            />
            <Feature
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="API keys encrypted client-side in your personal vault"
            />
            <Feature
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Runs entirely in your browser - nothing leaves your tab"
            />
          </ul>
        </aside>

        {/* Auth form */}
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-accent text-accent-fg shadow-glow">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-accent opacity-50 blur-md"
              />
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight">QA Hub</h1>
              <p className="truncate text-xs text-muted">Every QA tool you need, one workspace.</p>
            </div>
          </div>

          <Card className="overflow-hidden border-border/80 bg-surface/80 shadow-xl backdrop-blur">
            <CardContent className="p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-semibold tracking-tight">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {isSignup
                    ? 'Save your AI model setup, custom prompts, and encrypted keys to your account.'
                    : 'Sign in to sync your AI providers, prompts, and vault across sessions.'}
                </p>
              </div>

              {/* Mode switcher - animated segmented control */}
              <div className="relative mb-5 grid h-9 grid-cols-2 rounded-lg border border-border bg-surface-2 p-1 text-xs font-medium">
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-surface shadow-sm ring-1 ring-border/60 transition-transform duration-300 ease-out',
                    isSignup && 'translate-x-full',
                  )}
                />
                <ModeTab active={!isSignup} onClick={() => setMode('signin')}>
                  Sign in
                </ModeTab>
                <ModeTab active={isSignup} onClick={() => setMode('signup')}>
                  Create account
                </ModeTab>
              </div>

              {/* Google - promoted to the top for one-tap */}
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full"
                onClick={handleGoogle}
                disabled={busy !== null}
              >
                {busy === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
                <span className="h-px flex-1 bg-border" />
                or with email
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmail} className="space-y-3.5">
                <FloatingField
                  id="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="you@example.com"
                />

                <div>
                  <FloatingField
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="rounded p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                  {isSignup && password.length > 0 && (
                    <p
                      className={cn(
                        'mt-1.5 flex items-center gap-1.5 text-xs transition-colors',
                        passwordValid ? 'text-success' : 'text-muted',
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 transition-opacity',
                          passwordValid ? 'opacity-100' : 'opacity-40',
                        )}
                      />
                      At least 6 characters
                    </p>
                  )}
                </div>

                <Button type="submit" className="group h-10 w-full" disabled={busy !== null}>
                  {busy === 'email' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isSignup ? 'Creating…' : 'Signing in…'}
                    </>
                  ) : (
                    <>
                      {isSignup ? 'Create account' : 'Sign in'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted">
                {isSignup ? 'Already have an account?' : 'New to QA Hub?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(isSignup ? 'signin' : 'signup')}
                  className="font-medium text-accent transition-colors hover:underline"
                >
                  {isSignup ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[11px] text-muted">
            Authentication is handled by Firebase. Your API keys are encrypted in your browser
            before they ever touch the database.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

/** Shared frame with the gradient backdrop. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* Background flourishes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80rem_40rem_at_50%_-10%,hsl(var(--accent)/0.18),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-[20rem] w-[20rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(to_right,hsl(var(--fg))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--fg))_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(60%_50%_at_50%_50%,#000_40%,transparent)]"
      />

      <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-3 text-muted">
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-accent">
        {icon}
      </span>
      {label}
    </li>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative z-10 rounded-md transition-colors',
        active ? 'text-fg' : 'text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

interface FloatingFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

const FloatingField = React.forwardRef<HTMLInputElement, FloatingFieldProps>(
  ({ label, icon, trailing, id, className, ...props }, ref) => {
    return (
      <div className="group relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-accent">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          placeholder=" "
          className={cn(
            'peer h-12 w-full rounded-lg border border-border bg-surface-2/60 px-3 pt-4 text-sm shadow-sm transition-all placeholder:text-transparent focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-9',
            trailing && 'pr-10',
            className,
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-muted transition-all',
            'peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-medium peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent',
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider',
            icon ? 'left-9' : 'left-3',
          )}
        >
          {label}
        </label>
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    );
  },
);
FloatingField.displayName = 'FloatingField';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
