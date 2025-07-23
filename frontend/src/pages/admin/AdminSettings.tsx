import { useState } from 'react';
import { Save, Mail, Bell, Shield, Globe, Database, Key } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { language } = useTranslation();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'N3RVE Music Distribution',
    supportEmail: 'support@n3rve-onboarding.com',
    maxFileSize: 2048, // MB
    allowedFileTypes: ['WAV', 'FLAC', 'MP3'],
    
    // Notification Settings
    emailNotifications: true,
    newSubmissionAlert: true,
    dailyReport: true,
    weeklyAnalytics: false,
    
    // Security Settings
    sessionTimeout: 60, // minutes
    requireTwoFactor: false,
    ipWhitelist: false,
    ipAddresses: '',
    
    // API Settings
    apiRateLimit: 100, // requests per minute
    webhookUrl: '',
    apiKey: 'n3rve-api-key-xxxxx',
    
    // Storage Settings
    dropboxConnected: true,
    storageQuota: 500, // GB
    autoCleanup: false,
    cleanupDays: 90,
  });

  const handleSave = () => {
    // Save settings logic here
    toast.success(t('설정이 저장되었습니다', 'Settings saved successfully'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 animate-fade-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-500 bg-clip-text text-transparent mb-4">
            {t('관리자 설정', 'Admin Settings')}
          </h1>
          <p className="text-gray-700 dark:text-gray-300">
            {t('플랫폼 설정 및 구성을 관리합니다', 'Manage platform settings and configurations')}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Platform Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('플랫폼 설정', 'Platform Settings')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('플랫폼 이름', 'Platform Name')}
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('지원 이메일', 'Support Email')}
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('최대 파일 크기 (MB)', 'Max File Size (MB)')}
                </label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('허용 파일 형식', 'Allowed File Types')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {settings.allowedFileTypes.map((type) => (
                    <span key={type} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('알림 설정', 'Notification Settings')}
              </h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('이메일 알림', 'Email Notifications')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('새 제출 알림', 'New Submission Alerts')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.newSubmissionAlert}
                  onChange={(e) => setSettings({ ...settings, newSubmissionAlert: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('일일 리포트', 'Daily Reports')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.dailyReport}
                  onChange={(e) => setSettings({ ...settings, dailyReport: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('주간 분석', 'Weekly Analytics')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.weeklyAnalytics}
                  onChange={(e) => setSettings({ ...settings, weeklyAnalytics: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('보안 설정', 'Security Settings')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('세션 타임아웃 (분)', 'Session Timeout (minutes)')}
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('2단계 인증 필수', 'Require Two-Factor Auth')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.requireTwoFactor}
                  onChange={(e) => setSettings({ ...settings, requireTwoFactor: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('IP 화이트리스트', 'IP Whitelist')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.ipWhitelist}
                  onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              {settings.ipWhitelist && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('허용 IP 주소 (줄 단위)', 'Allowed IP Addresses (one per line)')}
                  </label>
                  <textarea
                    value={settings.ipAddresses}
                    onChange={(e) => setSettings({ ...settings, ipAddresses: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                    placeholder="192.168.1.1&#10;10.0.0.0/24"
                  />
                </div>
              )}
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('API 설정', 'API Settings')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('API 요청 제한 (분당)', 'API Rate Limit (per minute)')}
                </label>
                <input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('웹훅 URL', 'Webhook URL')}
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('API 키', 'API Key')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.apiKey}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <button className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all">
                    {t('재생성', 'Regenerate')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('스토리지 설정', 'Storage Settings')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('Dropbox 연결 상태', 'Dropbox Connection Status')}
                </label>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${settings.dropboxConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-700 dark:text-gray-300">
                    {settings.dropboxConnected ? t('연결됨', 'Connected') : t('연결 안됨', 'Not Connected')}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('스토리지 용량 (GB)', 'Storage Quota (GB)')}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={settings.storageQuota}
                    onChange={(e) => setSettings({ ...settings, storageQuota: parseInt(e.target.value) })}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('사용중: 243 GB', 'Used: 243 GB')}
                  </span>
                </div>
              </div>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('자동 정리', 'Auto Cleanup')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.autoCleanup}
                  onChange={(e) => setSettings({ ...settings, autoCleanup: e.target.checked })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
              
              {settings.autoCleanup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('정리 기간 (일)', 'Cleanup After (days)')}
                  </label>
                  <input
                    type="number"
                    value={settings.cleanupDays}
                    onChange={(e) => setSettings({ ...settings, cleanupDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {t('설정 저장', 'Save Settings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;