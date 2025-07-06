import React, { useState } from 'react';
import { User, Bell, Shield, Globe, CreditCard, Key, Save, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import { useAuthStore } from '@/store/auth.store';

const Settings = () => {
  const { t, language, setLanguage } = useLanguageStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: true
  });
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: ''
  });

  const tabs = [
    { id: 'profile', label: t('settings.profile', 'Profile'), icon: <User className="w-5 h-5" /> },
    { id: 'notifications', label: t('settings.notifications', 'Notifications'), icon: <Bell className="w-5 h-5" /> },
    { id: 'security', label: t('settings.security', 'Security'), icon: <Shield className="w-5 h-5" /> },
    { id: 'language', label: t('settings.language', 'Language'), icon: <Globe className="w-5 h-5" /> },
    { id: 'billing', label: t('settings.billing', 'Billing'), icon: <CreditCard className="w-5 h-5" /> }
  ];

  const handleSaveProfile = () => {
    // Save profile logic
    console.log('Saving profile:', profile);
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-600'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
            {t('settings.title', 'Settings')}
          </h1>
          <p className="text-gray-300">{t('settings.description', 'Manage your account preferences and settings')}</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'glass-effect bg-purple-600/20 text-white'
                    : 'hover:bg-gray-800/30 text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 glass-effect rounded-xl p-8 animate-slide-in">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.profileSettings', 'Profile Settings')}</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('settings.fullName', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('settings.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('settings.phone', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('settings.company', 'Company/Label')}
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                    />
                  </div>
                  
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all hover-lift flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {t('settings.saveChanges', 'Save Changes')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.notificationSettings', 'Notification Settings')}</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{t('settings.emailNotifications', 'Email Notifications')}</h3>
                      <p className="text-gray-400 text-sm">{t('settings.emailNotificationsDesc', 'Receive updates via email')}</p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.email}
                      onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{t('settings.pushNotifications', 'Push Notifications')}</h3>
                      <p className="text-gray-400 text-sm">{t('settings.pushNotificationsDesc', 'Browser push notifications')}</p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.push}
                      onChange={() => setNotifications({ ...notifications, push: !notifications.push })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{t('settings.smsNotifications', 'SMS Notifications')}</h3>
                      <p className="text-gray-400 text-sm">{t('settings.smsNotificationsDesc', 'Important updates via SMS')}</p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.sms}
                      onChange={() => setNotifications({ ...notifications, sms: !notifications.sms })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{t('settings.marketingEmails', 'Marketing Emails')}</h3>
                      <p className="text-gray-400 text-sm">{t('settings.marketingEmailsDesc', 'Promotional content and updates')}</p>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.marketing}
                      onChange={() => setNotifications({ ...notifications, marketing: !notifications.marketing })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.securitySettings', 'Security Settings')}</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <Key className="w-8 h-8 text-purple-400" />
                      <div>
                        <h3 className="text-white font-medium">{t('settings.changePassword', 'Change Password')}</h3>
                        <p className="text-gray-400 text-sm">{t('settings.lastChanged', 'Last changed 30 days ago')}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all">
                      {t('settings.updatePassword', 'Update Password')}
                    </button>
                  </div>
                  
                  <div className="p-6 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <Shield className="w-8 h-8 text-green-400" />
                      <div>
                        <h3 className="text-white font-medium">{t('settings.twoFactor', 'Two-Factor Authentication')}</h3>
                        <p className="text-gray-400 text-sm">{t('settings.twoFactorDesc', 'Add an extra layer of security')}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all">
                      {t('settings.enable2FA', 'Enable 2FA')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.languageSettings', 'Language Settings')}</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      language === 'en'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span>
                        <span className="text-white font-medium">English</span>
                      </div>
                      {language === 'en' && <CheckCircle className="w-5 h-5 text-purple-400" />}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setLanguage('ko')}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      language === 'ko'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇰🇷</span>
                        <span className="text-white font-medium">한국어</span>
                      </div>
                      {language === 'ko' && <CheckCircle className="w-5 h-5 text-purple-400" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.billingSettings', 'Billing Settings')}</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-800/30 rounded-lg">
                    <h3 className="text-white font-medium mb-4">{t('settings.currentPlan', 'Current Plan')}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xl font-bold text-purple-400">Pro Plan</p>
                        <p className="text-gray-400">$29.99/month</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all">
                        {t('settings.upgrade', 'Upgrade')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-800/30 rounded-lg">
                    <h3 className="text-white font-medium mb-4">{t('settings.paymentMethod', 'Payment Method')}</h3>
                    <div className="flex items-center gap-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-white">•••• •••• •••• 4242</p>
                        <p className="text-gray-400 text-sm">Expires 12/24</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;