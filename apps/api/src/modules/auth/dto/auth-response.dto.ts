export class AuthResponseDto {
  id: string;
  email: string;
  nameAr: string;
  nameEn?: string;
  role: string;
  token: string;
  companyId: string;
  branchId?: string;
}
