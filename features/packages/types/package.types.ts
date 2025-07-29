export interface Package {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName?: string; // Computed field from join
  status: PackageStatus;
  weight: string | null;
  dimensions: string | null;
  origin: string | null;
  destination: string;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: PackagePhoto[]; // Optional relation
}

export interface PackageFilters {
  status?: string;
  customerId?: string;
  search?: string;
  origin?: string;
  destination?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CreatePackageData {
  trackingNumber: string;
  customerId: string;
  status?: PackageStatus;
  weight?: string | null;
  dimensions?: string | null;
  origin?: string | null;
  destination: string;
  estimatedDelivery?: string | null;
}

export interface UpdatePackageData {
  trackingNumber?: string;
  customerId?: string;
  status?: PackageStatus;
  weight?: string | null;
  dimensions?: string | null;
  origin?: string | null;
  destination?: string;
  estimatedDelivery?: string | null;
}

export interface PackagePhoto {
  id: string;
  packageId: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

export type PackageStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';
