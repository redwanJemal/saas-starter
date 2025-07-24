'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Users, Eye, Edit, MoreHorizontal, Shield, UserX, Mail, Phone, Plus, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  userType: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{
    name: string;
    slug: string;
  }>;
}

interface UsersResponse {
  users: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'default' as const, icon: CheckCircle };
      case 'inactive':
        return { label: 'Inactive', variant: 'secondary' as const, icon: Clock };
      case 'suspended':
        return { label: 'Suspended', variant: 'destructive' as const, icon: AlertCircle };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// User type badge component
function UserTypeBadge({ type }: { type: string }) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'customer':
        return { label: 'Customer', variant: 'outline' as const };
      case 'admin':
        return { label: 'Admin', variant: 'destructive' as const };
      case 'staff':
        return { label: 'Staff', variant: 'default' as const };
      default:
        return { label: type, variant: 'secondary' as const };
    }
  };

  const config = getTypeConfig(type);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(userTypeFilter && { user_type: userTypeFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, search, userTypeFilter, statusFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUserInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">
              {row.original.firstName && row.original.lastName
                ? `${row.original.firstName} ${row.original.lastName}`
                : row.original.email}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-48">{row.original.email}</span>
            </div>
            {row.original.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{row.original.phone}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'userType',
      header: 'Type',
      cell: ({ row }) => <UserTypeBadge type={row.original.userType} />,
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.roles.length > 0 ? (
            row.original.roles.map((role, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {role.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-500">No roles assigned</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'verification',
      header: 'Verification',
      cell: ({ row }) => (
        <div>
          {row.original.emailVerifiedAt ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'activity',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-xs">
            Joined: {formatDate(row.original.createdAt)}
          </div>
          <div className="text-xs text-gray-500">
            Last login: {formatDate(row.original.lastLoginAt)}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Manage Roles
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === 'active' ? (
              <DropdownMenuItem className="text-red-600">
                <UserX className="mr-2 h-4 w-4" />
                Suspend User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Types</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/users/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </Link>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {pagination.total} total
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {users.filter(u => u.userType === 'admin').length} admins
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="email"
        searchPlaceholder="Search users..."
        isLoading={loading}
        loadingMessage="Loading users..."
        emptyMessage="No users found."
        onRefresh={fetchUsers}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}