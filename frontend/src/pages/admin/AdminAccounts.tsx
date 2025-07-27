import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Building2, UserPlus, ChevronDown, ChevronRight, Mail, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Account {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER' | 'SUB_ACCOUNT'
  companyName?: string
  parentAccountId?: string
  parentAccount?: {
    id: string
    name: string
    companyName: string
  }
  subAccounts?: Account[]
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

interface CreateAccountForm {
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER'
  companyName: string
  password: string
  accountType: 'individual' | 'company'
  parentAccountId?: string
}

export default function AdminAccounts() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateAccountForm>({
    email: '',
    name: '',
    role: 'CUSTOMER',
    companyName: '',
    password: '',
    accountType: 'individual'
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error(t('admin.accounts.fetchError', '계정 목록을 불러오는데 실패했습니다', 'Failed to fetch accounts', 'アカウントリストの読み込みに失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      if (!formData.email || !formData.name || !formData.password) {
        toast.error(t('common.fillAllFields', '모든 필드를 입력해주세요', 'Please fill in all fields', 'すべてのフィールドに入力してください'));
        return;
      }

      const payload = {
        ...formData,
        isCompanyAccount: formData.accountType === 'company'
      };

      await api.post('/admin/accounts', payload);
      toast.success(t('admin.accounts.createSuccess', '계정이 생성되었습니다', 'Account created successfully', 'アカウントが作成されました'));
      setShowCreateModal(false);
      setFormData({
        email: '',
        name: '',
        role: 'CUSTOMER',
        companyName: '',
        password: '',
        accountType: 'individual'
      });
      fetchAccounts();
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('admin.accounts.createError', '계정 생성에 실패했습니다', 'Failed to create account', 'アカウント作成に失敗しました'));
      }
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm(t('admin.accounts.deleteConfirm', '정말로 이 계정을 삭제하시겠습니까?', 'Are you sure you want to delete this account?', '本当にこのアカウントを削除しますか？'))) {
      return;
    }

    try {
      await api.delete(`/admin/accounts/${accountId}`);
      toast.success(t('admin.accounts.deleteSuccess', '계정이 삭제되었습니다', 'Account deleted successfully', 'アカウントが削除されました'));
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('admin.accounts.deleteError', '계정 삭제에 실패했습니다', 'Failed to delete account', 'アカウント削除に失敗しました'));
    }
  };

  const handleCreateSubAccount = async () => {
    try {
      if (!formData.email || !formData.name || !formData.password || !formData.parentAccountId) {
        toast.error(t('common.fillAllFields', '모든 필드를 입력해주세요', 'Please fill in all fields', 'すべてのフィールドに入力してください'));
        return;
      }

      await api.post('/admin/accounts/sub-account', {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        parentAccountId: formData.parentAccountId
      });

      toast.success(t('admin.accounts.subAccountCreated', '하위 계정이 생성되었습니다', 'Sub-account created successfully', 'サブアカウントが作成されました'));
      setShowCreateModal(false);
      setFormData({
        email: '',
        name: '',
        role: 'CUSTOMER',
        companyName: '',
        password: '',
        accountType: 'individual'
      });
      fetchAccounts();
    } catch (error: any) {
      console.error('Error creating sub-account:', error);
      toast.error(error.response?.data?.message || t('admin.accounts.subAccountError', '하위 계정 생성에 실패했습니다', 'Failed to create sub-account', 'サブアカウント作成に失敗しました'));
    }
  };

  const toggleCompanyExpand = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const filteredAccounts = accounts.filter(account =>
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate company accounts and individual accounts
  const companyAccounts = filteredAccounts.filter(acc => acc.subAccounts && acc.subAccounts.length > 0);
  const individualAccounts = filteredAccounts.filter(acc => !acc.parentAccountId && (!acc.subAccounts || acc.subAccounts.length === 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.accounts.title', '계정 관리', 'Account Management', 'アカウント管理')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.accounts.subtitle', '사용자 계정을 생성하고 관리합니다', 'Create and manage user accounts', 'ユーザーアカウントを作成および管理します')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('admin.accounts.createAccount', '계정 생성', 'Create Account', 'アカウント作成')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('admin.accounts.searchPlaceholder', '이메일, 이름, 회사명으로 검색...', 'Search by email, name, or company...', 'メール、名前、会社名で検索...')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Company Accounts */}
      {companyAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('admin.accounts.companyAccounts', '회사 계정', 'Company Accounts', '会社アカウント')}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {companyAccounts.map((company) => (
              <div key={company.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Company Header */}
                <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCompanyExpand(company.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {expandedCompanies.has(company.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {company.companyName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {company.email} • {company.subAccounts?.length || 0} {t('admin.accounts.subAccounts', '하위 계정', 'sub-accounts', 'サブアカウント')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          parentAccountId: company.id,
                          accountType: 'individual'
                        });
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      title={t('admin.accounts.addSubAccount', '하위 계정 추가', 'Add sub-account', 'サブアカウント追加')}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(company.id)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub Accounts */}
                {expandedCompanies.has(company.id) && company.subAccounts && company.subAccounts.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50">
                    {company.subAccounts.map((subAccount) => (
                      <div key={subAccount.id} className="pl-12 pr-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {subAccount.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {subAccount.email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(subAccount.id)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Accounts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('admin.accounts.individualAccounts', '개인 계정', 'Individual Accounts', '個人アカウント')}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.accounts.user', '사용자', 'User', 'ユーザー')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.accounts.role', '역할', 'Role', '役割')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.accounts.createdAt', '생성일', 'Created', '作成日')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.accounts.lastLogin', '마지막 로그인', 'Last Login', '最終ログイン')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.accounts.actions', '작업', 'Actions', '操作')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {individualAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      account.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                      {account.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {t(`roles.${account.role.toLowerCase()}`, account.role === 'ADMIN' ? '관리자' : '고객', account.role, account.role === 'ADMIN' ? '管理者' : '顧客')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {account.lastLogin ? new Date(account.lastLogin).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {individualAccounts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('admin.accounts.noAccounts', '계정이 없습니다', 'No accounts found', 'アカウントがありません')}
            </div>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {formData.parentAccountId
                ? t('admin.accounts.createSubAccount', '하위 계정 생성', 'Create Sub-Account', 'サブアカウント作成')
                : t('admin.accounts.createAccount', '계정 생성', 'Create Account')
              }
            </h2>

            <div className="space-y-4">
              {!formData.parentAccountId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('admin.accounts.accountType', '계정 유형', 'Account Type', 'アカウントタイプ')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={formData.accountType === 'individual'}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'individual' | 'company' })}
                        className="mr-2"
                      />
                      {t('admin.accounts.individual', '개인', 'Individual', '個人')}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="company"
                        checked={formData.accountType === 'company'}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'individual' | 'company' })}
                        className="mr-2"
                      />
                      {t('admin.accounts.company', '회사', 'Company', '会社')}
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.accounts.email', '이메일', 'Email', 'メールアドレス')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.accounts.name', '이름', 'Name', '名前')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder={t('admin.accounts.namePlaceholder', '사용자 이름', 'User name', 'ユーザー名')}
                />
              </div>

              {formData.accountType === 'company' && !formData.parentAccountId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('admin.accounts.companyName', '회사명', 'Company Name', '会社名')}
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder={t('admin.accounts.companyPlaceholder', '회사 이름', 'Company name', '会社名')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.accounts.password', '비밀번호', 'Password', 'パスワード')}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder={t('admin.accounts.passwordPlaceholder', '초기 비밀번호', 'Initial password', '初期パスワード')}
                />
              </div>

              {!formData.parentAccountId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('admin.accounts.role', '역할', 'Role', '役割')}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CUSTOMER' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="CUSTOMER">{t('roles.customer', '고객', 'Customer', '顧客')}</option>
                    <option value="ADMIN">{t('roles.admin', '관리자', 'Admin', '管理者')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    email: '',
                    name: '',
                    role: 'CUSTOMER',
                    companyName: '',
                    password: '',
                    accountType: 'individual'
                  });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('common.cancel', '취소', 'Cancel', 'キャンセル')}
              </button>
              <button
                onClick={formData.parentAccountId ? handleCreateSubAccount : handleCreateAccount}
                className="btn-primary"
              >
                {t('common.create', '생성', 'Create', '作成')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
