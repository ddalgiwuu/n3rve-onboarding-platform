import api from '@/lib/api';

export interface AccountInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  isCompanyAccount: boolean;
  parentAccountId?: string;
  parentAccount?: {
    id: string;
    name: string;
    company?: string;
  };
  subAccounts?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    subAccounts: number;
    submissions: number;
  };
}

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

export const userService = {
  async getAccountInfo(): Promise<AccountInfo> {
    const { data } = await api.get('/user/account-info');
    return data;
  },

  async getSubAccounts(): Promise<SubAccount[]> {
    const { data } = await api.get('/user/sub-accounts');
    return data;
  },

  async createSubAccount(subAccountData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<any> {
    const { data } = await api.post('/user/sub-accounts', subAccountData);
    return data;
  },

  async upgradeToCompanyAccount(company: string): Promise<any> {
    const { data } = await api.post('/user/upgrade-to-company', { company });
    return data;
  },
};