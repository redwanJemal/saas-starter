export interface Package {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  status: 'received' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description?: string;
  value?: number;
  receivedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  photos?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageFilters {
  status?: string;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePackageData {
  trackingNumber: string;
  customerId: string;
  description?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value?: number;
  notes?: string;
}

export interface UpdatePackageData {
  description?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value?: number;
  notes?: string;
  status?: string;
}
