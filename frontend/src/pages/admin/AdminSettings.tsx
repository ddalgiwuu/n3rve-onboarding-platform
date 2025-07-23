import { useState } from 'react';
import { Save, FileText, Zap, Mail, Building, Package, Activity, AlertCircle, Check, X, Upload } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { language } = useTranslation();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;
  
  const [settings, setSettings] = useState({
    // FUGA QC Management
    qcVersion: '2.1.0',
    qcAutoApprovalEnabled: true,
    qcErrorThreshold: 0, // 0 errors = auto-approve
    qcLastUpdated: '2025-07-15',
    
    // Submission Processing
    autoApprovalEnabled: true,
    trustedArtists: ['artist123', 'artist456'],
    reviewSLAHours: 48,
    priorityQueueEnabled: true,
    bulkActionLimit: 50,
    duplicateDetectionSensitivity: 'medium',
    
    // Communication Templates
    emailTemplates: {
      submissionReceived: true,
      approved: true,
      rejected: true,
      additionalInfoNeeded: true,
    },
    notificationChannels: {
      email: true,
      slack: false,
      webhook: false,
    },
    
    // Business Operations
    businessHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'Asia/Seoul',
    },
    workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    vipArtists: [],
    blockedArtists: [],
    
    // Distribution Settings
    fugaApiEnabled: true,
    defaultTerritories: ['WW'], // Worldwide
    releaseLeadDays: 14,
    metadataRequirements: {
      artistBio: true,
      albumDescription: true,
      trackCredits: true,
      artwork3000x3000: true,
    },
    
    // File Processing
    acceptedFormats: ['WAV', 'FLAC', 'MP3'],
    maxFileSizeMB: {
      WAV: 500,
      FLAC: 300,
      MP3: 50,
    },
    minBitrate: 320,
    artworkMinSize: 3000,
    
    // Platform Monitoring
    dropboxSyncEnabled: true,
    errorRateThreshold: 5, // percentage
    emailDeliveryRate: 98.5, // percentage
    maintenanceMode: false,
    maintenanceMessage: '',
  });

  const handleSave = () => {
    // Save settings logic here
    toast.success(t('설정이 저장되었습니다', 'Settings saved successfully'));
  };

  const addTrustedArtist = () => {
    const artistId = prompt(t('신뢰할 아티스트 ID 입력:', 'Enter trusted artist ID:'));
    if (artistId) {
      setSettings({
        ...settings,
        trustedArtists: [...settings.trustedArtists, artistId]
      });
    }
  };

  const removeTrustedArtist = (artistId: string) => {
    setSettings({
      ...settings,
      trustedArtists: settings.trustedArtists.filter(id => id !== artistId)
    });
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
            {t('플랫폼 운영에 필요한 핵심 설정을 관리합니다', 'Manage essential settings for platform operations')}
          </p>
        </div>

        <div className="grid gap-6">
          {/* FUGA QC Management */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('FUGA QC 관리', 'FUGA QC Management')}
                </h2>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                v{settings.qcVersion}
              </span>
            </div>
            
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('QC 자동 승인', 'QC Auto-Approval')}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.qcAutoApprovalEnabled}
                      onChange={(e) => setSettings({ ...settings, qcAutoApprovalEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('QC 오류가 0개일 때 자동으로 승인합니다', 'Auto-approve when QC errors = 0')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('오류 임계값', 'Error Threshold')}
                  </label>
                  <input
                    type="number"
                    value={settings.qcErrorThreshold}
                    onChange={(e) => setSettings({ ...settings, qcErrorThreshold: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('마지막 업데이트', 'Last Updated')}
                  </label>
                  <input
                    type="text"
                    value={settings.qcLastUpdated}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('검증 규칙 편집', 'Edit Validation Rules')}
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all">
                  {t('QC 테스트', 'Test QC Rules')}
                </button>
              </div>
            </div>
          </div>

          {/* Submission Processing */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('제출 처리 규칙', 'Submission Processing')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('검토 SLA (시간)', 'Review SLA (hours)')}
                  </label>
                  <input
                    type="number"
                    value={settings.reviewSLAHours}
                    onChange={(e) => setSettings({ ...settings, reviewSLAHours: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('일괄 작업 제한', 'Bulk Action Limit')}
                  </label>
                  <input
                    type="number"
                    value={settings.bulkActionLimit}
                    onChange={(e) => setSettings({ ...settings, bulkActionLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('중복 감지 민감도', 'Duplicate Detection Sensitivity')}
                </label>
                <select
                  value={settings.duplicateDetectionSensitivity}
                  onChange={(e) => setSettings({ ...settings, duplicateDetectionSensitivity: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                >
                  <option value="low">{t('낮음', 'Low')}</option>
                  <option value="medium">{t('중간', 'Medium')}</option>
                  <option value="high">{t('높음', 'High')}</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('신뢰할 아티스트', 'Trusted Artists')}
                  </label>
                  <button
                    onClick={addTrustedArtist}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    {t('+ 추가', '+ Add')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.trustedArtists.map((artistId) => (
                    <span key={artistId} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      {artistId}
                      <button
                        onClick={() => removeTrustedArtist(artistId)}
                        className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Communication Center */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('커뮤니케이션 센터', 'Communication Center')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('이메일 템플릿', 'Email Templates')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.emailTemplates).map(([key, enabled]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          emailTemplates: { ...settings.emailTemplates, [key]: e.target.checked }
                        })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {key === 'submissionReceived' && t('제출 접수', 'Submission Received')}
                        {key === 'approved' && t('승인됨', 'Approved')}
                        {key === 'rejected' && t('반려됨', 'Rejected')}
                        {key === 'additionalInfoNeeded' && t('추가 정보 필요', 'Additional Info Needed')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('알림 채널', 'Notification Channels')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(settings.notificationChannels).map(([channel, enabled]) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notificationChannels: { ...settings.notificationChannels, [channel]: e.target.checked }
                        })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {channel}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all w-full sm:w-auto">
                {t('템플릿 편집', 'Edit Templates')}
              </button>
            </div>
          </div>

          {/* Business Operations */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('비즈니스 운영', 'Business Operations')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('업무 시작 시간', 'Business Start Time')}
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.start}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: { ...settings.businessHours, start: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('업무 종료 시간', 'Business End Time')}
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.end}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: { ...settings.businessHours, end: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('근무일', 'Working Days')}
                </label>
                <div className="flex gap-2">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                    <label key={day} className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.workingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({
                              ...settings,
                              workingDays: [...settings.workingDays, day]
                            });
                          } else {
                            setSettings({
                              ...settings,
                              workingDays: settings.workingDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 dark:border-gray-600 peer-checked:border-purple-500 peer-checked:bg-purple-500 peer-checked:text-white transition-all">
                        <span className="text-xs font-medium uppercase">
                          {day.substring(0, 2)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Settings */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('배포 설정', 'Distribution Settings')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('FUGA API 연결', 'FUGA API Connection')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${settings.fugaApiEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                    {settings.fugaApiEnabled ? t('연결됨', 'Connected') : t('연결 안됨', 'Disconnected')}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('릴리즈 리드 타임 (일)', 'Release Lead Time (days)')}
                </label>
                <input
                  type="number"
                  value={settings.releaseLeadDays}
                  onChange={(e) => setSettings({ ...settings, releaseLeadDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('메타데이터 요구사항', 'Metadata Requirements')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.metadataRequirements).map(([key, required]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={required}
                        onChange={(e) => setSettings({
                          ...settings,
                          metadataRequirements: { ...settings.metadataRequirements, [key]: e.target.checked }
                        })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {key === 'artistBio' && t('아티스트 소개', 'Artist Bio')}
                        {key === 'albumDescription' && t('앨범 설명', 'Album Description')}
                        {key === 'trackCredits' && t('트랙 크레딧', 'Track Credits')}
                        {key === 'artwork3000x3000' && t('3000x3000 아트워크', '3000x3000 Artwork')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Monitoring */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-slide-in shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700/50" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('플랫폼 모니터링', 'Platform Monitoring')}
              </h2>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('Dropbox 동기화', 'Dropbox Sync')}
                    </span>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('마지막 동기화: 5분 전', 'Last sync: 5 minutes ago')}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('이메일 전달률', 'Email Delivery Rate')}
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {settings.emailDeliveryRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${settings.emailDeliveryRate}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('오류율 임계값 (%)', 'Error Rate Threshold (%)')}
                </label>
                <input
                  type="number"
                  value={settings.errorRateThreshold}
                  onChange={(e) => setSettings({ ...settings, errorRateThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      {t('유지보수 모드', 'Maintenance Mode')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
                {settings.maintenanceMode && (
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    placeholder={t('유지보수 메시지 입력...', 'Enter maintenance message...')}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-gray-900 dark:text-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-all">
              {t('취소', 'Cancel')}
            </button>
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