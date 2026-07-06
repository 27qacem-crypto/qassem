export class AccountTreeNode {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  type: string;
  nature: string;
  level: number;
  isDetail: boolean;
  isActive: boolean;
  balance?: number;
  children: AccountTreeNode[];
}
