import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, Music, TrendingUp, Download, Shield, User, X, ChevronDown, Check, Building2, Users, Link } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  joinedAt: string;
  submissionCount?: number;
  status: 'active' | 'inactive';
  lastActive?: string;
  role: string;
  isProfileComplete: boolean;
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
  subAccountsCount?: number;
}

const AdminCustomers = () => {
  const { language } = useTranslation();
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company: '',
    isCompanyAccount: false,
    parentAccountId: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingRole) {
        const target = event.target as HTMLElement;
        if (!target.closest('.role-dropdown')) {
          setEditingRole(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingRole]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      
      // Add defensive programming - check if response and users exist
      if (!response || !response.users || !Array.isArray(response.users)) {
        console.error('Invalid response format:', response);
        setCustomers([]);
        return;
      }
      
      // Transform users to customer format
      const customerData: Customer[] = response.users.map((user: any) => ({
        id: user.id || '',
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        joinedAt: user.createdAt || new Date().toISOString(),
        submissionCount: user.submissions || 0,
        status: user.isActive ? 'active' : 'inactive',
        lastActive: user.lastLogin || user.createdAt || new Date().toISOString(),
        role: user.role ? user.role.toLowerCase() : 'user',
        isProfileComplete: user.isProfileComplete || false,
        isCompanyAccount: user.isCompanyAccount || false,
        parentAccountId: user.parentAccountId,
        parentAccount: user.parentAccount,
        subAccounts: user.subAccounts,
        subAccountsCount: user.subAccountsCount || 0
      }));
      
      setCustomers(customerData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('고객 정보를 불러오는 중 오류가 발생했습니다.', 'Error fetching customers', '顧客情報の読み込み中にエラーが発生しました'));
      setCustomers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success(t('역할이 성공적으로 변경되었습니다.', 'Role updated successfully', 'ロールが正常に更新されました'));
      setEditingRole(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(t('역할 변경 중 오류가 발생했습니다.', 'Error updating role', 'ロール更新中にエラーが発生しました'));
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Shield : User;
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' 
      : 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.password) {
      toast.error(t('모든 필드를 입력해주세요.', 'Please fill in all fields', 'すべてのフィールドを入力してください'));
      return;
    }

    try {
      await adminService.createUser(newCustomer);
      toast.success(t('새 사용자가 추가되었습니다.', 'New user added successfully', '新しいユーザーが正常に追加されました'));
      setShowAddModal(false);
      setNewCustomer({ name: '', email: '', password: '', role: 'user', company: '', isCompanyAccount: false, parentAccountId: '' });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      if (error.response?.data?.message?.includes('Unique constraint')) {
        toast.error(t('이미 존재하는 이메일입니다.', 'Email already exists', 'このメールアドレスは既に存在します'));
      } else {
        toast.error(t('사용자 추가 중 오류가 발생했습니다.', 'Error adding user', 'ユーザー追加中にエラーが発生しました'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 animate-fade-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-500 bg-clip-text text-transparent mb-4">
                {t('고객 관리', 'Customer Management', '顧客管理')}
              </h1>
              <p className="text-gray-700 dark:text-gray-300">{t('고객 정보를 관리하고 분석합니다', 'Manage and analyze customer information', '顧客情報を管理・分析します')}</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {t('새 고객 추가', 'Add New Customer', '新規顧客追加')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <UserPlus className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-400 text-sm font-medium">{t('전체 고객', 'Total Customers', '全顧客数')}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500 dark:text-green-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{customers.filter(c => c.status === 'active').length}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-400 text-sm font-medium">{t('활성 고객', 'Active Customers', 'アクティブ顧客')}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <Music className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{customers.reduce((sum, c) => sum + (c.submissionCount || 0), 0)}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-400 text-sm font-medium">{t('전체 제출', 'Total Submissions', '総提出数')}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {customers.filter(c => {
                  const joinDate = new Date(c.joinedAt);
                  const now = new Date();
                  return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-400 text-sm font-medium">{t('이번 달 신규', 'New This Month', '今月の新規')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 animate-slide-in-delayed shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('고객 검색...', 'Search customers...', '顧客を検索...')}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('모든 상태', 'All Statuses', 'すべてのステータス')}</option>
              <option value="active">{t('활성', 'Active', 'アクティブ')}</option>
              <option value="inactive">{t('비활성', 'Inactive', '非アクティブ')}</option>
            </select>
            <button className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all hover-lift flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('내보내기', 'Export', 'エクスポート')}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden animate-slide-in-delayed shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={selectAllCustomers}
                        className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('이름', 'Name', '名前')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('역할', 'Role', 'ロール')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('계정 유형', 'Account Type', 'アカウントタイプ')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('연락처', 'Contact', '連絡先')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('가입일', 'Joined', '登録日')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('제출', 'Submissions', '提出')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('상태', 'Status', 'ステータス')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {customer.name ? customer.name.split(' ').map(n => n[0] || '').join('') : '?'}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-white font-medium">{customer.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative role-dropdown">
                          {editingRole === customer.id ? (
                            <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-fade-in">
                              <button
                                onClick={() => {
                                  handleRoleChange(customer.id, 'user');
                                  setEditingRole(null);
                                }}
                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  customer.role === 'user' ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                }`}
                              >
                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="flex-1 text-left text-gray-900 dark:text-white">{t('사용자', 'User', 'ユーザー')}</span>
                                {customer.role === 'user' && <Check className="w-4 h-4 text-green-500" />}
                              </button>
                              <button
                                onClick={() => {
                                  handleRoleChange(customer.id, 'admin');
                                  setEditingRole(null);
                                }}
                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  customer.role === 'admin' ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                                }`}
                              >
                                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="flex-1 text-left text-gray-900 dark:text-white">{t('관리자', 'Admin', '管理者')}</span>
                                {customer.role === 'admin' && <Check className="w-4 h-4 text-green-500" />}
                              </button>
                            </div>
                          ) : null}
                          
                          <button
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${getRoleColor(customer.role)} hover:shadow-md`}
                            onClick={() => setEditingRole(editingRole === customer.id ? null : customer.id)}
                          >
                            {(() => {
                              const Icon = getRoleIcon(customer.role);
                              return <Icon className="w-4 h-4" />;
                            })()}
                            <span>
                              {customer.role === 'admin' 
                                ? t('관리자', 'Admin', '管理者') 
                                : t('사용자', 'User', 'ユーザー')}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${editingRole === customer.id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {customer.isCompanyAccount ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {t('회사 계정', 'Company Account', '会社アカウント')}
                              </span>
                              {customer.subAccountsCount ? (
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                  {customer.subAccountsCount} {t('하위', 'sub', 'サブ')}
                                </span>
                              ) : null}
                            </div>
                          ) : customer.parentAccount ? (
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {t('하위 계정', 'Sub Account', 'サブアカウント')}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {customer.parentAccount.company || customer.parentAccount.name}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {t('개인 계정', 'Individual', '個人アカウント')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span className="font-medium">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium">{format(new Date(customer.joinedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{customer.submissionCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          customer.status === 'active'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {customer.status === 'active' ? t('활성', 'Active', 'アクティブ') : t('비활성', 'Inactive', '非アクティブ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-scale-in shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('새 고객 추가', 'Add New Customer', '新規顧客追加')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('이름', 'Name', '名前')}
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder={t('사용자 이름', 'User name', 'ユーザー名')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('이메일', 'Email', 'メール')}
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder={t('이메일 주소', 'Email address', 'メールアドレス')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('비밀번호', 'Password', 'パスワード')}
                </label>
                <input
                  type="password"
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder={t('비밀번호', 'Password', 'パスワード')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('역할', 'Role', 'ロール')}
                </label>
                <select
                  value={newCustomer.role}
                  onChange={(e) => setNewCustomer({ ...newCustomer, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                >
                  <option value="user">{t('사용자', 'User', 'ユーザー')}</option>
                  <option value="admin">{t('관리자', 'Admin', '管理者')}</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCustomer.isCompanyAccount}
                    onChange={(e) => setNewCustomer({ ...newCustomer, isCompanyAccount: e.target.checked })}
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('회사 계정으로 생성', 'Create as Company Account', '会社アカウントとして作成')}
                  </span>
                </label>
              </div>

              {newCustomer.isCompanyAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('회사명', 'Company Name', '会社名')}
                  </label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                    placeholder={t('회사명 입력', 'Enter company name', '会社名を入力')}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all"
              >
                {t('취소', 'Cancel', 'キャンセル')}
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all hover-lift"
              >
                {t('추가', 'Add', '追加')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;