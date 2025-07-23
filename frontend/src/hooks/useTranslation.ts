import { useLanguageStore } from '@/store/language.store'
import useSafeStore from './useSafeStore'

const translations = {
  ko: {
    // Auth translations
    'auth.welcomeTitle': 'N3RVE 온보딩 플랫폼에 오신 것을 환영합니다',
    'auth.welcomeSubtitle': 'Google 계정으로 간편하게 로그인하세요',
    'auth.continueWithGoogle': 'Google로 계속하기',
    'auth.signingIn': '로그인 중...',
    'auth.secureLogin': '안전한 로그인',
    'auth.googleLoginDescription': 'Google 계정을 통해 안전하고 빠르게 로그인할 수 있습니다',
    'auth.oauthFailed': 'OAuth 인증에 실패했습니다. 다시 시도해주세요.',
    'auth.loginFailed': '로그인에 실패했습니다',
    'auth.popupBlocked': '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.',
    'auth.loginRequired': '로그인이 필요합니다',
    'auth.loginSuccess': '로그인되었습니다',
    'auth.loginProcessError': '로그인 처리 중 오류가 발생했습니다',
    'auth.signingInProgress': '로그인 중...',
    
    // Profile Setup
    'profile.setupTitle': '프로필 설정을 완료하세요',
    'profile.setupSubtitle': '서비스 이용을 위해 추가 정보를 입력해주세요',
    'profile.company': '회사명',
    'profile.companyPlaceholder': '소속 회사 또는 레이블명을 입력하세요',
    'profile.phone': '전화번호',
    'profile.phonePlaceholder': '010-1234-5678',
    'profile.complete': '프로필 설정 완료',
    'profile.completing': '설정 중...',
    'profile.helpText': '이 정보는 계정 관리 및 지원을 위해 사용됩니다',
    'profile.setupComplete': '프로필 설정이 완료되었습니다!',
    'profile.setupFailed': '프로필 설정에 실패했습니다. 다시 시도해주세요.',
    
    // Time Picker
    'time.quickSelect': '빠른 선택',
    'time.hours': '시간',
    'time.minutes': '분',
    'time.done': '완료',
    
    // Common UI
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다',
    'common.retry': '다시 시도',
    'common.close': '닫기',
    'common.search': '검색...',
    'common.noResults': '검색 결과가 없습니다',
    
    // Settings translations
    'settings.title': '설정',
    'settings.description': '계정 및 앱 설정을 관리하세요',
    'settings.profile': '프로필',
    'settings.notifications': '알림',
    'settings.security': '보안',
    'settings.language': '언어',
    'settings.billing': '결제',
    'settings.profileSettings': '프로필 설정',
    'settings.fullName': '이름',
    'settings.email': '이메일',
    'settings.phone': '전화번호',
    'settings.company': '회사',
    'settings.saveChanges': '변경사항 저장',
    'settings.notificationSettings': '알림 설정',
    'settings.emailNotifications': '이메일 알림',
    'settings.emailNotificationsDesc': '중요한 업데이트를 이메일로 받습니다',
    'settings.pushNotifications': '푸시 알림',
    'settings.pushNotificationsDesc': '브라우저 푸시 알림을 받습니다',
    'settings.smsNotifications': 'SMS 알림',
    'settings.smsNotificationsDesc': '중요한 알림을 문자로 받습니다',
    'settings.marketingEmails': '마케팅 이메일',
    'settings.marketingEmailsDesc': '프로모션 및 뉴스를 받습니다',
    'settings.securitySettings': '보안 설정',
    'settings.changePassword': '비밀번호 변경',
    'settings.lastChanged': '마지막 변경: 30일 전',
    'settings.updatePassword': '비밀번호 업데이트',
    'settings.twoFactor': '2단계 인증',
    'settings.twoFactorDesc': '계정에 추가 보안 계층을 추가합니다',
    'settings.enable2FA': '2단계 인증 활성화',
    'settings.languageSettings': '언어 설정',
    'settings.billingSettings': '결제 설정',
    'settings.currentPlan': '현재 플랜',
    'settings.upgrade': '업그레이드',
    'settings.paymentMethod': '결제 수단',
  },
  en: {
    // Auth translations
    'auth.welcomeTitle': 'Welcome to N3RVE Onboarding Platform',
    'auth.welcomeSubtitle': 'Sign in with your Google account to continue',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.signingIn': 'Signing in...',
    'auth.secureLogin': 'Secure Login',
    'auth.googleLoginDescription': 'Log in quickly and securely with your Google account',
    'auth.oauthFailed': 'OAuth authentication failed. Please try again.',
    'auth.loginFailed': 'Login failed',
    'auth.popupBlocked': 'Popup blocked. Please allow popups and try again.',
    'auth.loginRequired': 'Login required',
    'auth.loginSuccess': 'Logged in successfully',
    'auth.loginProcessError': 'An error occurred during login',
    'auth.signingInProgress': 'Signing in...',
    
    // Profile Setup
    'profile.setupTitle': 'Complete Your Profile Setup',
    'profile.setupSubtitle': 'Please provide additional information to continue',
    'profile.company': 'Company',
    'profile.companyPlaceholder': 'Enter your company or label name',
    'profile.phone': 'Phone Number',
    'profile.phonePlaceholder': '010-1234-5678',
    'profile.complete': 'Complete Profile Setup',
    'profile.completing': 'Setting up...',
    'profile.helpText': 'This information is used for account management and support',
    'profile.setupComplete': 'Profile setup completed successfully!',
    'profile.setupFailed': 'Profile setup failed. Please try again.',
    
    // Time Picker
    'time.quickSelect': 'Quick Select',
    'time.hours': 'Hours',
    'time.minutes': 'Minutes',
    'time.done': 'Done',
    
    // Common UI
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Try again',
    'common.close': 'Close',
    'common.search': 'Search...',
    'common.noResults': 'No results found',
    
    // Settings translations
    'settings.title': 'Settings',
    'settings.description': 'Manage your account and app preferences',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.language': 'Language',
    'settings.billing': 'Billing',
    'settings.profileSettings': 'Profile Settings',
    'settings.fullName': 'Full Name',
    'settings.email': 'Email',
    'settings.phone': 'Phone',
    'settings.company': 'Company',
    'settings.saveChanges': 'Save Changes',
    'settings.notificationSettings': 'Notification Settings',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailNotificationsDesc': 'Receive important updates via email',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushNotificationsDesc': 'Receive browser push notifications',
    'settings.smsNotifications': 'SMS Notifications',
    'settings.smsNotificationsDesc': 'Receive important alerts via text',
    'settings.marketingEmails': 'Marketing Emails',
    'settings.marketingEmailsDesc': 'Receive promotions and news',
    'settings.securitySettings': 'Security Settings',
    'settings.changePassword': 'Change Password',
    'settings.lastChanged': 'Last changed: 30 days ago',
    'settings.updatePassword': 'Update Password',
    'settings.twoFactor': 'Two-Factor Authentication',
    'settings.twoFactorDesc': 'Add an extra layer of security to your account',
    'settings.enable2FA': 'Enable 2FA',
    'settings.languageSettings': 'Language Settings',
    'settings.billingSettings': 'Billing Settings',
    'settings.currentPlan': 'Current Plan',
    'settings.upgrade': 'Upgrade',
    'settings.paymentMethod': 'Payment Method',
  },
  ja: {
    // Auth translations
    'auth.welcomeTitle': 'N3RVEオンボーディングプラットフォームへようこそ',
    'auth.welcomeSubtitle': 'Googleアカウントでサインインしてください',
    'auth.continueWithGoogle': 'Googleで続ける',
    'auth.signingIn': 'サインイン中...',
    'auth.secureLogin': '安全なログイン',
    'auth.googleLoginDescription': 'Googleアカウントで安全かつ迅速にログインできます',
    'auth.oauthFailed': 'OAuth認証に失敗しました。もう一度お試しください。',
    'auth.loginFailed': 'ログインに失敗しました',
    'auth.popupBlocked': 'ポップアップがブロックされました。ポップアップを許可してください。',
    'auth.loginRequired': 'ログインが必要です',
    'auth.loginSuccess': 'ログインしました',
    'auth.loginProcessError': 'ログイン処理中にエラーが発生しました',
    'auth.signingInProgress': 'サインイン中...',
    
    // Profile Setup
    'profile.setupTitle': 'プロフィール設定を完了してください',
    'profile.setupSubtitle': '続行するには追加情報を入力してください',
    'profile.company': '会社名',
    'profile.companyPlaceholder': '会社名またはレーベル名を入力してください',
    'profile.phone': '電話番号',
    'profile.phonePlaceholder': '010-1234-5678',
    'profile.complete': 'プロフィール設定を完了',
    'profile.completing': '設定中...',
    'profile.helpText': 'この情報はアカウント管理とサポートに使用されます',
    'profile.setupComplete': 'プロフィール設定が完了しました！',
    'profile.setupFailed': 'プロフィール設定に失敗しました。もう一度お試しください。',
    
    // Time Picker
    'time.quickSelect': 'クイック選択',
    'time.hours': '時間',
    'time.minutes': '分',
    'time.done': '完了',
    
    // Common UI
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.retry': 'もう一度試す',
    'common.close': '閉じる',
    'common.search': '検索...',
    'common.noResults': '検索結果がありません',
    
    // Settings translations
    'settings.title': '設定',
    'settings.description': 'アカウントとアプリの設定を管理します',
    'settings.profile': 'プロフィール',
    'settings.notifications': '通知',
    'settings.security': 'セキュリティ',
    'settings.language': '言語',
    'settings.billing': '請求',
    'settings.profileSettings': 'プロフィール設定',
    'settings.fullName': '氏名',
    'settings.email': 'メールアドレス',
    'settings.phone': '電話番号',
    'settings.company': '会社',
    'settings.saveChanges': '変更を保存',
    'settings.notificationSettings': '通知設定',
    'settings.emailNotifications': 'メール通知',
    'settings.emailNotificationsDesc': '重要な更新をメールで受け取ります',
    'settings.pushNotifications': 'プッシュ通知',
    'settings.pushNotificationsDesc': 'ブラウザのプッシュ通知を受け取ります',
    'settings.smsNotifications': 'SMS通知',
    'settings.smsNotificationsDesc': '重要なアラートをテキストで受け取ります',
    'settings.marketingEmails': 'マーケティングメール',
    'settings.marketingEmailsDesc': 'プロモーションやニュースを受け取ります',
    'settings.securitySettings': 'セキュリティ設定',
    'settings.changePassword': 'パスワード変更',
    'settings.lastChanged': '最終変更: 30日前',
    'settings.updatePassword': 'パスワードを更新',
    'settings.twoFactor': '二要素認証',
    'settings.twoFactorDesc': 'アカウントに追加のセキュリティレイヤーを追加します',
    'settings.enable2FA': '2FAを有効化',
    'settings.languageSettings': '言語設定',
    'settings.billingSettings': '請求設定',
    'settings.currentPlan': '現在のプラン',
    'settings.upgrade': 'アップグレード',
    'settings.paymentMethod': '支払い方法',
  }
}

export function useTranslation() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  
  // Support for direct language strings instead of key-based translations
  const t = (key: string, ko: string, en: string, ja?: string): string => {
    // If using the old format with translations object
    if (arguments.length === 1 || arguments.length === 2) {
      const fallback = arguments[1]
      const lang = language as keyof typeof translations
      const currentTranslations = translations[lang] || translations.en
      return currentTranslations[key as keyof typeof currentTranslations] || fallback || key
    }
    
    // New format with direct language strings
    switch (language) {
      case 'ko':
        return ko
      case 'en':
        return en
      case 'ja':
        return ja || en // Fallback to English if Japanese not provided
      default:
        return en
    }
  }
  
  return { t, language }
}