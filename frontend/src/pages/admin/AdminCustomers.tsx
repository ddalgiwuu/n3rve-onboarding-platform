import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, Music, TrendingUp, Download } from 'lucide-react';
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
}

const AdminCustomers = () => {
  const { language } = useTranslation();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      
      // Transform users to customer format
      const customerData: Customer[] = response.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company || '',
        joinedAt: user.createdAt,
        submissionCount: 0, // TODO: Get from submissions count
        status: user.isActive ? 'active' : 'inactive',
        lastActive: user.lastLogin || user.createdAt,
        role: user.role,
        isProfileComplete: user.isProfileComplete
      }));
      
      setCustomers(customerData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('고객 정보를 불러오는 중 오류가 발생했습니다.', 'Error fetching customers'));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
                {t('고객 관리', 'Customer Management')}
              </h1>
              <p className="text-gray-300">{t('고객 정보를 관리하고 분석합니다', 'Manage and analyze customer information')}</p>
            </div>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all hover-lift flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {t('새 고객 추가', 'Add New Customer')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <UserPlus className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{customers.length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('전체 고객', 'Total Customers')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{customers.filter(c => c.status === 'active').length}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('활성 고객', 'Active Customers')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <Music className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{customers.reduce((sum, c) => sum + (c.submissionCount || 0), 0)}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('전체 제출', 'Total Submissions')}</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {customers.filter(c => {
                  const joinDate = new Date(c.joinedAt);
                  const now = new Date();
                  return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{t('이번 달 신규', 'New This Month')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-xl p-6 mb-8 animate-slide-in-delayed">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('고객 검색...', 'Search customers...')}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('모든 상태', 'All Statuses')}</option>
              <option value="active">{t('활성', 'Active')}</option>
              <option value="inactive">{t('비활성', 'Inactive')}</option>
            </select>
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all hover-lift flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('내보내기', 'Export')}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="glass-effect rounded-xl overflow-hidden animate-slide-in-delayed">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={selectAllCustomers}
                        className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('이름', 'Name')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('연락처', 'Contact')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('가입일', 'Joined')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('제출', 'Submissions')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('회사', 'Company')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('상태', 'Status')}</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">{t('마지막 활동', 'Last Active')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-800/30 transition-colors">
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
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <p className="text-white font-medium">{customer.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(customer.joinedAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{customer.submissionCount}</td>
                      <td className="px-6 py-4 text-gray-300">{customer.company || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          customer.status === 'active'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {customer.status === 'active' ? t('활성', 'Active') : t('비활성', 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {customer.lastActive && customer.lastActive !== '' ? format(new Date(customer.lastActive), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;