import { useAuthStore } from '@/store/auth.store'
import { useTranslation } from '@/store/language.store'
import { LayoutDashboard, Music, FileText, Users, TrendingUp, Upload, ChevronRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)
  const { t } = useTranslation()

  const stats = [
    {
      label: t('총 릴리스', 'Total Releases'),
      value: '0',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      description: t('등록된 앨범', 'Registered albums'),
    },
    {
      label: t('대기 중', 'Pending'),
      value: '0',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      description: t('검토 대기 중', 'Awaiting review'),
    },
    {
      label: t('아티스트', 'Artists'),
      value: '0',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      description: t('등록된 아티스트', 'Registered artists'),
    },
  ]

  const recentSubmissions: any[] = []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
      case 'review': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('승인됨', 'Approved')
      case 'pending': return t('대기 중', 'Pending')
      case 'review': return t('검토 중', 'In Review')
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('환영합니다', 'Welcome back')}, {user?.name || user?.email}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('오늘도 좋은 하루 되세요', 'Have a great day today')}
              </p>
            </div>
            <Link
              to="/onboarding"
              className="btn-modern btn-primary flex items-center gap-2 hover-lift"
            >
              <Upload className="w-5 h-5" />
              {t('새 릴리스', 'New Release')}
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
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
            )
          })}
        </div>

        {/* Recent Submissions */}
        <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('최근 제출', 'Recent Submissions')}
            </h2>
            <Link
              to="/submissions"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              {t('모두 보기', 'View all')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('아직 제출된 음원이 없습니다', 'No submissions yet')}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/onboarding"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-4 mx-auto w-fit">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {t('새 릴리스 등록', 'Submit New Release')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('음원을 등록하고 배포하세요', 'Register and distribute your music')}
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
              {t('가이드 보기', 'View Guide')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('제출 가이드라인 확인', 'Check submission guidelines')}
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
              {t('아티스트 프로필', 'Artist Profile')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('프로필 작성 가이드', 'Profile creation guide')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}