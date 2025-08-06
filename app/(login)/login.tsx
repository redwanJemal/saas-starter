// app/(login)/login.tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { Logo } from '@/components/logo-img';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="h-[200px] w-[200px]" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin' ? (
            <>
              Or{' '}
              <Link 
                href={`/sign-up${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`} 
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                create a new account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link 
                href={`/sign-in${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`} 
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Sign in here
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form action={formAction} className="space-y-6">
            {/* Hidden fields for redirect and other params */}
            {redirect && <input type="hidden" name="redirect" value={redirect} />}
            {priceId && <input type="hidden" name="priceId" value={priceId} />}
            {inviteId && <input type="hidden" name="inviteId" value={inviteId} />}
            
            {/* Show error if exists */}
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            {/* Signup specific fields */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Enter your first name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    We'll use this for important account notifications
                  </p>
                </div>
              </>
            )}

            {/* Email field */}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              )}
            </div>

            {/* Sign in specific - Forgot password link */}
            {mode === 'signin' && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-orange-600 hover:text-orange-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            )}

            {/* Terms and Privacy for signup */}
            {mode === 'signup' && (
              <div className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-orange-600 hover:text-orange-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-500">
                  Privacy Policy
                </Link>
                .
              </div>
            )}

            {/* Submit button */}
            <div>
              <Button
                type="submit"
                disabled={pending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'signin' ? 'Sign in' : 'Create account'
                )}
              </Button>
            </div>
          </form>

          {/* Additional signup benefits */}
          {mode === 'signup' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">What you'll get</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Virtual addresses in multiple countries
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Package consolidation and forwarding
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Personal shopping service
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Real-time package tracking
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}