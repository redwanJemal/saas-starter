// app/(dashboard)/dashboard/security/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Trash2, 
  Loader2, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useActionState, useState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';
import { User as UserType } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

function SecurityStatusCard() {
  const { data: user } = useSWR<UserType>('/api/user', fetcher);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const securityItems = [
    {
      icon: Key,
      title: 'Password',
      description: 'Strong password set',
      status: 'secure',
      statusText: 'Secure'
    },
    {
      icon: CheckCircle,
      title: 'Email Verification',
      description: user.emailVerifiedAt ? 'Email verified' : 'Email not verified',
      status: user.emailVerifiedAt ? 'secure' : 'warning',
      statusText: user.emailVerifiedAt ? 'Verified' : 'Pending'
    },
    {
      icon: Shield,
      title: 'Two-Factor Authentication',
      description: user.twoFactorEnabled ? '2FA enabled' : '2FA not enabled',
      status: user.twoFactorEnabled ? 'secure' : 'warning',
      statusText: user.twoFactorEnabled ? 'Enabled' : 'Disabled'
    },
    {
      icon: CheckCircle,
      title: 'Account Status',
      description: `Account is ${user.status}`,
      status: user.status === 'active' ? 'secure' : 'error',
      statusText: user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {securityItems.map((item, index) => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'secure': return 'bg-green-50 text-green-700 border-green-200';
              case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
              case 'error': return 'bg-red-50 text-red-700 border-red-200';
              default: return 'bg-gray-50 text-gray-700 border-gray-200';
            }
          };

          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(item.status)}>
                {item.statusText}
              </Badge>
            </div>
          );
        })}

        {user.lastLoginAt && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Last sign in: {new Date(user.lastLoginAt).toLocaleString()}
              {user.lastLoginIp && ` from ${user.lastLoginIp}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PasswordChangeForm() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {}
  );

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={passwordAction}>
          <div>
            <Label htmlFor="current-password" className="mb-2">
              Current Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-password" className="mb-2">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {passwordState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{passwordState.error}</p>
            </div>
          )}

          {passwordState.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{passwordState.success}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isPasswordPending}
          >
            {isPasswordPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteAccountForm() {
  const [deleteState, deleteAction, isDeletePending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    {}
  );

  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
            <p className="text-sm text-red-700 mb-3">
              Once you delete your account, there is no going back. This will permanently delete:
            </p>
            <ul className="text-sm text-red-700 space-y-1 mb-4">
              <li>• Your customer profile and ID</li>
              <li>• All package and shipment history</li>
              <li>• Saved addresses and preferences</li>
              <li>• Virtual warehouse addresses</li>
              <li>• All invoices and payment records</li>
            </ul>
            <p className="text-sm font-medium text-red-800">
              This action cannot be undone. Please be certain.
            </p>
          </div>

          <form action={deleteAction} className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="confirm-delete" className="text-sm">
                I understand that this action cannot be undone
              </Label>
            </div>

            {confirmDelete && (
              <div>
                <Label htmlFor="delete-password" className="mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="delete-password"
                    name="password"
                    type={showDeletePassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={100}
                    defaultValue={deleteState.password}
                    className="pr-10"
                    placeholder="Enter your password to confirm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                  >
                    {showDeletePassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {deleteState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{deleteState.error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isDeletePending || !confirmDelete}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account Permanently
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account security and password settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security Status and Password Change */}
        <div className="lg:col-span-2 space-y-8">
          <PasswordChangeForm />
          <DeleteAccountForm />
        </div>

        {/* Security Status Sidebar */}
        <div>
          <SecurityStatusCard />
        </div>
      </div>
    </section>
  );
}