import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { useHydration } from '@/hooks/useHydration';
import { Music, FileText, Users, Upload, ChevronRight, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useSafeStore from '@/hooks/useSafeStore';

export default function Dashboard() {
  const isHydrated = useHydration();
  const user = useSafeStore(useAuthStore, (state) => state.user);
  const { t } = useTranslation();

  // Show loading spinner until stores are hydrated
  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  const stats = [
    {
      label: t('총 릴리스', '총 릴리스', 'Total Releases', '総リリース'),
      value: '0',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      description: t('등록된 앨범', '등록된 앨범', 'Registered Albums', '登録済みアルバム')
    },
    {
      label: t('대기 중', '대기 중', 'Pending', '待機中'),
      value: '0',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      description: t('검토 대기 중', '검토 대기 중', 'Awaiting Review', 'レビュー待ち')
    },
    {
      label: t('아티스트', '아티스트', 'Artists', 'アーティスト'),
      value: '0',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      description: t('등록된 아티스트', '등록된 아티스트', 'Registered Artists', '登録済みアーティスト')
    }
  ];

  const recentSubmissions: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'review': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('승인됨', '승인됨', 'Approved', '承認済み');
      case 'pending': return t('대기 중', '대기 중', 'Pending', '待機中');
      case 'review': return t('검토 중', '검토 중', 'In Review', 'レビュー中');
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('환영합니다', '환영합니다', 'Welcome', 'ようこそ')}, {user?.name || user?.email}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('오늘도 좋은 하루 되세요', '오늘도 좋은 하루 되세요', 'Have a great day', '今日も良い一日を')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/release-submission-modern"
                className="btn-modern btn-primary flex items-center gap-2 hover-lift"
              >
                <Upload className="w-5 h-5" />
                {t('새 릴리스', '새 릴리스', 'New Release', '新規リリース')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="card-glass p-6 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {stat.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent Submissions */}
        <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('최근 제출', '최근 제출', 'Recent Submissions', '最近の提出')}
            </h2>
            <Link
              to="/submissions"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              {t('모두 보기', '모두 보기', 'View All', 'すべて表示')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('아직 제출된 음원이 없습니다', '아직 제출된 음원이 없습니다', 'No submitted tracks yet', 'まだ提出された音源がありません')}
                </p>
              </div>
            ) : (
              recentSubmissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="glass-effect p-4 rounded-xl hover:shadow-lg transition-all duration-300 animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {submission.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {submission.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {submission.date}
                      </div>
                      <span className={`badge-glass ${getStatusColor(submission.status)} px-3 py-1`}>
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link
            to="/release-submission-modern"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-4 mx-auto w-fit">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {t('새 릴리스 등록', '새 릴리스 등록', 'Register New Release', '新規リリース登録')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('음원을 등록하고 배포하세요', '음원을 등록하고 배포하세요', 'Register and distribute your music', '音源を登録して配信しましょう')}
            </p>
          </Link>

          <Link
            to="/guide"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg mb-4 mx-auto w-fit">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {t('가이드 보기', '가이드 보기', 'View Guide', 'ガイドを見る')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('제출 가이드라인 확인', '제출 가이드라인 확인', 'Check submission guidelines', '提出ガイドラインを確認')}
            </p>
          </Link>

          <Link
            to="/artist-profile-guide"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg mb-4 mx-auto w-fit">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {t('아티스트 프로필', '아티스트 프로필', 'Artist Profile', 'アーティストプロフィール')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('프로필 작성 가이드', '프로필 작성 가이드', 'Profile Writing Guide', 'プロフィール作成ガイド')}
            </p>
          </Link>

          <Link
            to="/account"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg mb-4 mx-auto w-fit">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t('계정 관리', '계정 관리', 'Account Management', 'アカウント管理')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('회사 및 하위 계정 관리', '회사 및 하위 계정 관리', 'Manage company and sub-accounts', '会社とサブアカウントを管理')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
