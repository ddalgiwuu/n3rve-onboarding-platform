import { useMemo } from 'react';
import { useLanguageStore } from '@/contexts/LanguageContext';

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
    'auth.logoutSuccess': '로그아웃되었습니다',
    'auth.subtitle': '공식 음원 유통 플랫폼',
    'auth.googleLogin': 'Google 로그인',
    'auth.emailLogin': '이메일 로그인',
    'auth.noAccount': '계정이 없으신가요?',
    'auth.contactAdmin': '관리자에게 계정 생성을 요청하세요',
    'auth.securityNotice': '안전한 SSL 암호화 연결',

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

    // Navigation
    'nav.home': '홈',
    'nav.dashboard': '대시보드',
    'nav.submissions': '제출 내역',
    'nav.submissionHistory': '제출 내역',
    'nav.admin': '관리자',
    'nav.settings': '설정',
    'nav.logout': '로그아웃',
    'nav.profile': '프로필',
    'nav.musicDistribution': '음원 배급',
    'nav.newSubmission': '새 음원 제출',
    'nav.guide': '가이드',
    'nav.artistProfile': '아티스트 프로필',
    'nav.accountManagement': '계정 관리',
    'nav.adminDashboard': '관리자 대시보드',
    'nav.submissionManagement': '제출 관리',
    'nav.customerManagement': '고객 관리',
    'nav.toCustomerConsole': '고객 콘솔로',
    'nav.toAdminConsole': '관리자 콘솔로',

    // Role Selection
    'roleSelect.title': '역할을 선택하세요',
    'roleSelect.subtitle': 'N3RVE 플랫폼에서 사용할 모드를 선택해주세요',
    'roleSelect.adminMode': '관리자 모드',
    'roleSelect.adminDesc': '시스템 관리 및 사용자 관리',
    'roleSelect.userMode': '사용자 모드',
    'roleSelect.userDesc': '음원 발매 및 제출 관리',
    'roleSelect.manageSubmissions': '제출물 관리',
    'roleSelect.userManagement': '사용자 관리',
    'roleSelect.analytics': '분석 도구',
    'roleSelect.submitReleases': '음원 발매 제출',
    'roleSelect.submissionHistory': '제출 이력',
    'roleSelect.distributionStatus': '배포 상태',
    'roleSelect.access': '접속하기',

    // Common UI
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다',
    'common.retry': '다시 시도',
    'common.close': '닫기',

    // Actions
    'action.submit': '제출',
    'action.save': '저장',
    'action.cancel': '취소',
    'action.delete': '삭제',
    'action.edit': '편집',
    'action.back': '뒤로',
    'action.next': '다음',
    'action.continue': '계속',

    // Language
    'language.korean': '한국어',
    'language.english': '영어',
    'language.japanese': '일본어',

    // Admin Dashboard
    'admin.dashboard': '관리자 대시보드',
    'admin.exportExcel': '엑셀 다운로드',
    'admin.totalSubmissions': '전체 제출',
    'admin.pendingReview': '검토 대기',
    'admin.approved': '승인됨',
    'admin.rejected': '반려됨',
    'admin.totalUsers': '전체 사용자',
    'admin.searchPlaceholder': '아티스트, 앨범, 제출자 검색...',
    'admin.allStatus': '전체 상태',
    'admin.recentSubmissions': '최근 제출 내역',
    'admin.date': '제출일',
    'admin.artist': '아티스트',
    'admin.album': '앨범명',
    'admin.submitter': '제출자',
    'admin.status': '상태',
    'admin.noData': '제출된 데이터가 없습니다',
    'admin.viewAllSubmissions': '모든 제출 보기 →',
    'admin.manageSubmissions': '제출 관리',
    'admin.manageSubmissionsDesc': '모든 제출 내역 검토 및 관리',
    'admin.manageUsers': '사용자 관리',
    'admin.manageUsersDesc': '사용자 계정 및 권한 관리',
    'admin.platformSettings': '플랫폼 설정',
    'admin.platformSettingsDesc': '시스템 설정 및 구성 관리',
    'admin.pending': '대기 중',
    'admin.actions': '작업',
    'admin.view': '상세보기',

    // Dashboard translations
    'dashboard.totalReleases': '총 릴리스',
    'dashboard.registeredAlbums': '등록된 앨범',
    'dashboard.pending': '대기 중',
    'dashboard.awaitingReview': '검토 대기 중',
    'dashboard.artists': '아티스트',
    'dashboard.registeredArtists': '등록된 아티스트',
    'dashboard.status.approved': '승인됨',
    'dashboard.status.pending': '대기 중',
    'dashboard.status.inReview': '검토 중',
    'dashboard.welcome': '환영합니다',
    'dashboard.haveGreatDay': '오늘도 좋은 하루 되세요',
    'dashboard.newRelease': '새 릴리스',
    'dashboard.recentSubmissions': '최근 제출',
    'dashboard.viewAll': '모두 보기',
    'dashboard.noSubmittedTracks': '아직 제출된 음원이 없습니다',
    'dashboard.registerNewRelease': '새 릴리스 등록',
    'dashboard.registerAndDistribute': '음원을 등록하고 배포하세요',
    'dashboard.viewGuide': '가이드 보기',
    'dashboard.checkGuidelines': '제출 가이드라인 확인',
    'dashboard.artistProfile': '아티스트 프로필',
    'dashboard.profileWritingGuide': '프로필 작성 가이드',
    'dashboard.accountManagement': '계정 관리',
    'dashboard.manageSubAccounts': '회사 및 하위 계정 관리'
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
    'auth.logoutSuccess': 'Logged out successfully',
    'auth.subtitle': 'Official Music Distribution Platform',
    'auth.googleLogin': 'Google Login',
    'auth.emailLogin': 'Email Login',
    'auth.noAccount': "Don't have an account?",
    'auth.contactAdmin': 'Contact admin for account creation',
    'auth.securityNotice': 'Secure SSL encrypted connection',

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

    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.submissions': 'Submissions',
    'nav.submissionHistory': 'Submissions',
    'nav.admin': 'Admin',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.profile': 'Profile',
    'nav.musicDistribution': 'Music Distribution',
    'nav.newSubmission': 'New Submission',
    'nav.guide': 'Guide',
    'nav.artistProfile': 'Artist Profile',
    'nav.accountManagement': 'Account Management',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.submissionManagement': 'Submission Management',
    'nav.customerManagement': 'Customer Management',
    'nav.toCustomerConsole': 'To Customer Console',
    'nav.toAdminConsole': 'To Admin Console',

    // Role Selection
    'roleSelect.title': 'Choose Your Role',
    'roleSelect.subtitle': 'Select the mode you want to use on N3RVE platform',
    'roleSelect.adminMode': 'Admin Mode',
    'roleSelect.adminDesc': 'System management and user administration',
    'roleSelect.userMode': 'User Mode',
    'roleSelect.userDesc': 'Music release and submission management',
    'roleSelect.manageSubmissions': 'Manage Submissions',
    'roleSelect.userManagement': 'User Management',
    'roleSelect.analytics': 'Analytics Tools',
    'roleSelect.submitReleases': 'Submit Releases',
    'roleSelect.submissionHistory': 'Submission History',
    'roleSelect.distributionStatus': 'Distribution Status',
    'roleSelect.access': 'Access',

    // Common UI
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Try again',
    'common.close': 'Close',

    // Actions
    'action.submit': 'Submit',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.continue': 'Continue',

    // Language
    'language.korean': 'Korean',
    'language.english': 'English',
    'language.japanese': 'Japanese',

    // Admin Dashboard
    'admin.dashboard': 'Admin Dashboard',
    'admin.exportExcel': 'Export to Excel',
    'admin.totalSubmissions': 'Total Submissions',
    'admin.pendingReview': 'Pending Review',
    'admin.approved': 'Approved',
    'admin.rejected': 'Rejected',
    'admin.totalUsers': 'Total Users',
    'admin.searchPlaceholder': 'Search artist, album, submitter...',
    'admin.allStatus': 'All Status',
    'admin.recentSubmissions': 'Recent Submissions',
    'admin.date': 'Date',
    'admin.artist': 'Artist',
    'admin.album': 'Album',
    'admin.submitter': 'Submitter',
    'admin.status': 'Status',
    'admin.noData': 'No submissions found',
    'admin.viewAllSubmissions': 'View All Submissions →',
    'admin.manageSubmissions': 'Manage Submissions',
    'admin.manageSubmissionsDesc': 'Review and manage all submissions',
    'admin.manageUsers': 'Manage Users',
    'admin.manageUsersDesc': 'Manage user accounts and permissions',
    'admin.platformSettings': 'Platform Settings',
    'admin.platformSettingsDesc': 'Manage system settings and configuration',
    'admin.pending': 'Pending',
    'admin.actions': 'Actions',
    'admin.view': 'View',

    // Dashboard translations
    'dashboard.totalReleases': 'Total Releases',
    'dashboard.registeredAlbums': 'Registered Albums',
    'dashboard.pending': 'Pending',
    'dashboard.awaitingReview': 'Awaiting Review',
    'dashboard.artists': 'Artists',
    'dashboard.registeredArtists': 'Registered Artists',
    'dashboard.status.approved': 'Approved',
    'dashboard.status.pending': 'Pending',
    'dashboard.status.inReview': 'In Review',
    'dashboard.welcome': 'Welcome',
    'dashboard.haveGreatDay': 'Have a great day',
    'dashboard.newRelease': 'New Release',
    'dashboard.recentSubmissions': 'Recent Submissions',
    'dashboard.viewAll': 'View All',
    'dashboard.noSubmittedTracks': 'No submitted tracks yet',
    'dashboard.registerNewRelease': 'Register New Release',
    'dashboard.registerAndDistribute': 'Register and distribute your music',
    'dashboard.viewGuide': 'View Guide',
    'dashboard.checkGuidelines': 'Check submission guidelines',
    'dashboard.artistProfile': 'Artist Profile',
    'dashboard.profileWritingGuide': 'Profile Writing Guide',
    'dashboard.accountManagement': 'Account Management',
    'dashboard.manageSubAccounts': 'Manage company and sub-accounts'
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
    'auth.logoutSuccess': 'ログアウトしました',
    'auth.subtitle': '公式音楽配信プラットフォーム',
    'auth.googleLogin': 'Googleログイン',
    'auth.emailLogin': 'メールログイン',
    'auth.noAccount': 'アカウントをお持ちでない方',
    'auth.contactAdmin': '管理者にアカウント作成を依頼してください',
    'auth.securityNotice': '安全なSSL暗号化接続',

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

    // Navigation
    'nav.home': 'ホーム',
    'nav.dashboard': 'ダッシュボード',
    'nav.submissions': '提出履歴',
    'nav.submissionHistory': '提出履歴',
    'nav.admin': '管理者',
    'nav.settings': '設定',
    'nav.logout': 'ログアウト',
    'nav.profile': 'プロフィール',
    'nav.musicDistribution': '音楽配信',
    'nav.newSubmission': '新規提出',
    'nav.guide': 'ガイド',
    'nav.artistProfile': 'アーティストプロフィール',
    'nav.accountManagement': 'アカウント管理',
    'nav.adminDashboard': '管理者ダッシュボード',
    'nav.submissionManagement': '提出管理',
    'nav.customerManagement': '顧客管理',
    'nav.toCustomerConsole': '顧客コンソールへ',
    'nav.toAdminConsole': '管理者コンソールへ',

    // Role Selection
    'roleSelect.title': 'ロールを選択してください',
    'roleSelect.subtitle': 'N3RVEプラットフォームで使用するモードを選択してください',
    'roleSelect.adminMode': '管理者モード',
    'roleSelect.adminDesc': 'システム管理とユーザー管理',
    'roleSelect.userMode': 'ユーザーモード',
    'roleSelect.userDesc': '音楽リリースと提出管理',
    'roleSelect.manageSubmissions': '提出物管理',
    'roleSelect.userManagement': 'ユーザー管理',
    'roleSelect.analytics': '分析ツール',
    'roleSelect.submitReleases': 'リリース提出',
    'roleSelect.submissionHistory': '提出履歴',
    'roleSelect.distributionStatus': '配信状況',
    'roleSelect.access': 'アクセス',

    // Common UI
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.retry': 'もう一度試す',
    'common.close': '閉じる',

    // Actions
    'action.submit': '提出',
    'action.save': '保存',
    'action.cancel': 'キャンセル',
    'action.delete': '削除',
    'action.edit': '編集',
    'action.back': '戻る',
    'action.next': '次へ',
    'action.continue': '続ける',

    // Language
    'language.korean': '韓国語',
    'language.english': '英語',
    'language.japanese': '日本語',

    // Admin Dashboard
    'admin.dashboard': '管理者ダッシュボード',
    'admin.exportExcel': 'Excelにエクスポート',
    'admin.totalSubmissions': '総提出数',
    'admin.pendingReview': '審査待ち',
    'admin.approved': '承認済み',
    'admin.rejected': '却下',
    'admin.totalUsers': '総ユーザー数',
    'admin.searchPlaceholder': 'アーティスト、アルバム、提出者を検索...',
    'admin.allStatus': 'すべてのステータス',
    'admin.recentSubmissions': '最近の提出履歴',
    'admin.date': '提出日',
    'admin.artist': 'アーティスト',
    'admin.album': 'アルバム',
    'admin.submitter': '提出者',
    'admin.status': 'ステータス',
    'admin.noData': '提出データがありません',
    'admin.viewAllSubmissions': 'すべての提出を表示 →',
    'admin.manageSubmissions': '提出管理',
    'admin.manageSubmissionsDesc': 'すべての提出履歴の確認と管理',
    'admin.manageUsers': 'ユーザー管理',
    'admin.manageUsersDesc': 'ユーザーアカウントと権限管理',
    'admin.platformSettings': 'プラットフォーム設定',
    'admin.platformSettingsDesc': 'システム設定と構成管理',
    'admin.pending': '待機中',
    'admin.actions': 'アクション',
    'admin.view': '詳細表示',

    // Dashboard translations
    'dashboard.totalReleases': '総リリース数',
    'dashboard.registeredAlbums': '登録済みアルバム',
    'dashboard.pending': '待機中',
    'dashboard.awaitingReview': 'レビュー待ち',
    'dashboard.artists': 'アーティスト',
    'dashboard.registeredArtists': '登録済みアーティスト',
    'dashboard.status.approved': '承認済み',
    'dashboard.status.pending': '待機中',
    'dashboard.status.inReview': 'レビュー中',
    'dashboard.welcome': 'ようこそ',
    'dashboard.haveGreatDay': '今日も良い一日を',
    'dashboard.newRelease': '新規リリース',
    'dashboard.recentSubmissions': '最近の提出',
    'dashboard.viewAll': 'すべて表示',
    'dashboard.noSubmittedTracks': 'まだ提出された音源がありません',
    'dashboard.registerNewRelease': '新規リリース登録',
    'dashboard.registerAndDistribute': '音源を登録して配信しましょう',
    'dashboard.viewGuide': 'ガイドを見る',
    'dashboard.checkGuidelines': '提出ガイドラインを確認',
    'dashboard.artistProfile': 'アーティストプロフィール',
    'dashboard.profileWritingGuide': 'プロフィール作成ガイド',
    'dashboard.accountManagement': 'アカウント管理',
    'dashboard.manageSubAccounts': '会社とサブアカウントを管理'
  }
};

export function useTranslation() {
  const languageStore = useLanguageStore();

  // Create translation function with explicit parameter handling
  const t = useMemo(() => (key?: string, ko?: string, en?: string, ja?: string): string => {
    // Get current language inside the function (not in closure)
    const language = languageStore._hasHydrated ? languageStore.language : 'ko';

    // Handle undefined/null key
    if (!key || typeof key !== 'string') {
      console.warn('Translation key is undefined or not a string:', key);
      return String(key || '');
    }

    // Determine how many explicit language strings were provided
    const providedArgsCount = [ko, en, ja].filter(v => v !== undefined).length;

    // Pattern 1: Key-based translations (single parameter or key + fallback)
    if (providedArgsCount === 0) {
      // Pure key lookup
      const lang = language as keyof typeof translations;
      const currentTranslations = translations[lang] || translations.en;
      const translatedText = currentTranslations[key as keyof typeof currentTranslations];
      return translatedText || key;
    }

    // Pattern 1b: Key + fallback (key, fallback)
    if (providedArgsCount === 1) {
      const lang = language as keyof typeof translations;
      const currentTranslations = translations[lang] || translations.en;
      const translatedText = currentTranslations[key as keyof typeof currentTranslations];
      return translatedText || (ko as string) || key;
    }

    // Pattern 2: Direct language strings (actual format when called: ko, en, ja without key)
    // When t(koStr, enStr, jaStr) is called, params map as: key=koStr, ko=enStr, en=jaStr, ja=undefined
    if (providedArgsCount >= 2) {
      switch (language) {
        case 'ko':
          return key; // First param is actually Korean string
        case 'en':
          return ko || key; // Second param is actually English string
        case 'ja':
          return en || ko || key; // Third param is actually Japanese string
        default:
          return ko || key; // Default to English
      }
    }

    // Pattern 3: Two parameter format - assume it's (key, fallback) or (ko, en)
    if (providedArgsCount === 1 && ko) {
      // Check if it's a translation key lookup with fallback
      const lang = language as keyof typeof translations;
      const currentTranslations = translations[lang] || translations.en;
      const translatedText = currentTranslations[key as keyof typeof currentTranslations];

      if (translatedText) {
        return translatedText;
      }

      // If no translation found, treat as (ko, en) format
      switch (language) {
        case 'ko':
          return key; // First param is Korean in this case
        case 'en':
          return ko; // Second param is English in this case
        case 'ja':
          return ko || key; // Fallback to English or Korean
        default:
          return ko || key;
      }
    }

    return key; // Final fallback
  }, [languageStore.language, languageStore._hasHydrated]);

  // Even before hydration, provide translation functionality with defaults
  const language = languageStore._hasHydrated ? languageStore.language : 'ko';

  return { t, language };
}
