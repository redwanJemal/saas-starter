// app/(dashboard)/dashboard/general/page.tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, MapPin, Package } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User as UserType } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  firstNameValue?: string;
  lastNameValue?: string;
  emailValue?: string;
  phoneValue?: string;
};

function AccountForm({ 
  state, 
  firstNameValue = '', 
  lastNameValue = '',
  emailValue = '',
  phoneValue = ''
}: AccountFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="mb-2">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            defaultValue={state.firstName || firstNameValue}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-2">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Enter your last name"
            defaultValue={state.lastName || lastNameValue}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email" className="mb-2">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={state.email || emailValue}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone" className="mb-2">
          Phone Number
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Enter your phone number"
          defaultValue={state.phone || phoneValue}
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<UserType>('/api/user', fetcher);

  return (
    <AccountForm
      state={state}
      firstNameValue={user?.firstName ?? ''}
      lastNameValue={user?.lastName ?? ''}
      emailValue={user?.email ?? ''}
      phoneValue={user?.phone ?? ''}
    />
  );
}

function CustomerInfoCard() {
  const { data: user } = useSWR<UserType>('/api/user', fetcher);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Customer ID</p>
              <p className="text-xs text-gray-500">Your unique identifier</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Loading...
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Account Type</p>
              <p className="text-xs text-gray-500">Customer account level</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {user.userType === 'customer' ? 'Individual' : user.userType}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-xs text-gray-500">Current account standing</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={
              user.status === 'active' 
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }
          >
            {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Email Verification</p>
              <p className="text-xs text-gray-500">Email confirmation status</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={
              user.emailVerifiedAt 
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }
          >
            {user.emailVerifiedAt ? 'Verified' : 'Pending'}
          </Badge>
        </div>

        {user.createdAt && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Information Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" action={formAction}>
                <Suspense fallback={<AccountForm state={state} />}>
                  <AccountFormWithData state={state} />
                </Suspense>

                {state.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{state.error}</p>
                  </div>
                )}

                {state.success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{state.success}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Customer Information Sidebar */}
        <div>
          <CustomerInfoCard />

          {/* Additional Information Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-3">
                  If you need to update your customer ID or have issues with your account, 
                  please contact our support team.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>support@platform.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>+971 4 123 4567</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Important Notes:</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Email changes require verification</li>
                  <li>• Customer ID cannot be changed</li>
                  <li>• Profile updates are logged for security</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}