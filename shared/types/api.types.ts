
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  // ============================================================================= 
  // API ERROR RESPONSE INTERFACE
  // =============================================================================
  
  export interface ApiErrorResponse {
    error: string;
    details?: any;
  }