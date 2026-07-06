export interface AuthUser {
  id: string;
  email: string;
  nameAr: string;
  nameEn?: string;
  role: string;
  companyId: string;
  branchId?: string;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nameAr: string;
  nameEn?: string;
  phone?: string;
}
