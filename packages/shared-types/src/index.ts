export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface MenuItem {
  labelAr: string;
  labelEn?: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
  permission?: string;
}
