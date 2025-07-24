import { useState, useEffect } from 'react';
import { Building2, UserPlus, Users, Shield, Mail, Calendar, Check, X, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { userService, AccountInfo, SubAccount } from '@/services/user.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AccountSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddSubAccountModal, setShowAddSubAccountModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [newSubAccount, setNewSubAccount] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      setLoading(true);
      const [info, subs] = await Promise.all([
        userService.getAccountInfo(),
        userService.getSubAccounts().catch(() => [])
      ]);
      setAccountInfo(info);
      setSubAccounts(subs);
    } catch (error) {
      console.error('Error fetching account info:', error);
      toast.error(t('계정 정보를 불러오는 중 오류가 발생했습니다.', 'Error loading account information', 'アカウント情報の読み込み中にエラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeAccount = async () => {
    if (!companyName.trim()) {
      toast.error(t('회사명을 입력해주세요.', 'Please enter company name', '会社名を入力してください'));
      return;
    }

    try {
      await userService.upgradeToCompanyAccount(companyName);
      toast.success(t('회사 계정으로 업그레이드되었습니다.', 'Upgraded to company account', '会社アカウントにアップグレードされました'));
      setShowUpgradeModal(false);
      setCompanyName('');
      fetchAccountInfo();
    } catch (error) {
      console.error('Error upgrading account:', error);
      toast.error(t('업그레이드 중 오류가 발생했습니다.', 'Error during upgrade', 'アップグレード中にエラーが発生しました'));
    }
  };

  const handleCreateSubAccount = async () => {
    if (!newSubAccount.name || !newSubAccount.email || !newSubAccount.password) {
      toast.error(t('모든 필드를 입력해주세요.', 'Please fill in all fields', 'すべてのフィールドを入力してください'));
      return;
    }

    try {
      await userService.createSubAccount(newSubAccount);
      toast.success(t('하위 계정이 생성되었습니다.', 'Sub-account created', 'サブアカウントが作成されました'));
      setShowAddSubAccountModal(false);
      setNewSubAccount({ name: '', email: '', password: '', role: 'user' });
      fetchAccountInfo();
    } catch (error: any) {
      console.error('Error creating sub-account:', error);
      if (error.response?.data?.message?.includes('Unique constraint')) {
        toast.error(t('이미 존재하는 이메일입니다.', 'Email already exists', 'このメールアドレスは既に存在します'));
      } else {
        toast.error(t('하위 계정 생성 중 오류가 발생했습니다.', 'Error creating sub-account', 'サブアカウント作成中にエラーが発生しました'));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 animate-fade-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-500 bg-clip-text text-transparent mb-4">
            {t('계정 설정', 'Account Settings', 'アカウント設定')}
          </h1>
          <p className="text-gray-700 dark:text-gray-300">
            {t('계정 정보 및 하위 계정을 관리합니다', 'Manage your account information and sub-accounts', 'アカウント情報とサブアカウントを管理します')}
          </p>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-purple-500" />
            {t('계정 정보', 'Account Information', 'アカウント情報')}
          </h2>
          
          {accountInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('이름', 'Name', '名前')}</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{accountInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('이메일', 'Email', 'メール')}</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{accountInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('역할', 'Role', 'ロール')}</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {accountInfo.role === 'ADMIN' ? t('관리자', 'Admin', '管理者') : t('사용자', 'User', 'ユーザー')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('계정 유형', 'Account Type', 'アカウントタイプ')}</p>
                <div className="flex items-center gap-2">
                  {accountInfo.isCompanyAccount ? (
                    <>
                      <Building2 className="w-5 h-5 text-indigo-500" />
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{accountInfo.company || t('회사 계정', 'Company Account', '会社アカウント')}</p>
                    </>
                  ) : accountInfo.parentAccount ? (
                    <>
                      <Users className="w-5 h-5 text-blue-500" />
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {t('하위 계정', 'Sub Account', 'サブアカウント')} - {accountInfo.parentAccount.company || accountInfo.parentAccount.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 text-gray-500" />
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{t('개인 계정', 'Individual Account', '個人アカウント')}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upgrade to Company Account */}
          {accountInfo && !accountInfo.isCompanyAccount && !accountInfo.parentAccountId && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                {t('회사 계정으로 업그레이드', 'Upgrade to Company Account', '会社アカウントにアップグレード')}
              </button>
            </div>
          )}
        </div>

        {/* Sub Accounts */}
        {accountInfo?.isCompanyAccount && (
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in-delayed shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-500" />
                {t('하위 계정', 'Sub Accounts', 'サブアカウント')} ({accountInfo._count.subAccounts})
              </h2>
              <button
                onClick={() => setShowAddSubAccountModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {t('하위 계정 추가', 'Add Sub Account', 'サブアカウント追加')}
              </button>
            </div>

            {subAccounts.length > 0 ? (
              <div className="grid gap-4">
                {subAccounts.map((subAccount) => (
                  <div key={subAccount.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {subAccount.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{subAccount.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span>{subAccount.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('제출', 'Submissions', '提出')}: {subAccount._count.submissions}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {t('가입일', 'Joined', '登録日')}: {format(new Date(subAccount.createdAt), 'yyyy-MM-dd')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subAccount.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {subAccount.isActive ? t('활성', 'Active', 'アクティブ') : t('비활성', 'Inactive', '非アクティブ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('하위 계정이 없습니다.', 'No sub-accounts yet.', 'サブアカウントがありません。')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-scale-in shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('회사 계정으로 업그레이드', 'Upgrade to Company Account', '会社アカウントにアップグレード')}
                </h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('회사명', 'Company Name', '会社名')}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                    placeholder={t('회사명을 입력하세요', 'Enter company name', '会社名を入力してください')}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t(
                      '회사 계정으로 업그레이드하면 하위 계정을 생성하고 관리할 수 있습니다.',
                      'Upgrading to a company account allows you to create and manage sub-accounts.',
                      '会社アカウントにアップグレードすると、サブアカウントを作成して管理できます。'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all"
                >
                  {t('취소', 'Cancel', 'キャンセル')}
                </button>
                <button
                  onClick={handleUpgradeAccount}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all hover-lift"
                >
                  {t('업그레이드', 'Upgrade', 'アップグレード')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Sub Account Modal */}
        {showAddSubAccountModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-scale-in shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('하위 계정 추가', 'Add Sub Account', 'サブアカウント追加')}
                </h2>
                <button
                  onClick={() => setShowAddSubAccountModal(false)}
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
                    value={newSubAccount.name}
                    onChange={(e) => setNewSubAccount({ ...newSubAccount, name: e.target.value })}
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
                    value={newSubAccount.email}
                    onChange={(e) => setNewSubAccount({ ...newSubAccount, email: e.target.value })}
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
                    value={newSubAccount.password}
                    onChange={(e) => setNewSubAccount({ ...newSubAccount, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                    placeholder={t('비밀번호', 'Password', 'パスワード')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('역할', 'Role', 'ロール')}
                  </label>
                  <select
                    value={newSubAccount.role}
                    onChange={(e) => setNewSubAccount({ ...newSubAccount, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white"
                  >
                    <option value="user">{t('사용자', 'User', 'ユーザー')}</option>
                    <option value="admin">{t('관리자', 'Admin', '管理者')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddSubAccountModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all"
                >
                  {t('취소', 'Cancel', 'キャンセル')}
                </button>
                <button
                  onClick={handleCreateSubAccount}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover-lift"
                >
                  {t('추가', 'Add', '追加')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}