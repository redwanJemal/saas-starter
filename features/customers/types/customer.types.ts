export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  notes: string | null;
  packageCount?: number; // Computed field
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  status?: string;
  search?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  status?: 'active' | 'inactive' | 'pending' | 'blocked';
  notes?: string | null;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  status?: 'active' | 'inactive' | 'pending' | 'blocked';
  notes?: string | null;
}
