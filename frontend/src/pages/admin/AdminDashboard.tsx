import { useLanguageStore } from '@/store/language.store'
import { 
  Users, 
  Music, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Activity,
  Download,
  Eye,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { t } = useLanguageStore()

  const stats = [
    {
      label: t('총 사용자', 'Total Users'),
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      trend: 'up'
    },
    {
      label: t('활성 릴리스', 'Active Releases'),
      value: '456',
      change: '+8%',
      icon: Music,
      color: 'from-blue-500 to-cyan-500',
      trend: 'up'
    },
    {
      label: t('월 수익', 'Monthly Revenue'),
      value: '₩12.5M',
      change: '+23%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: 'up'
    },
    {
      label: t('대기 중 승인', 'Pending Approvals'),
      value: '23',
      change: '-5%',
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      trend: 'down'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'submission',
      user: 'Kim Jisoo',
      action: t('새 릴리스 제출', 'submitted new release'),
      item: 'Moonlight Symphony',
      time: t('5분 전', '5 minutes ago')
    },
    {
      id: 2,
      type: 'user',
      user: 'Park Jimin',
      action: t('계정 생성', 'created account'),
      item: '',
      time: t('15분 전', '15 minutes ago')
    },
    {
      id: 3,
      type: 'approval',
      user: 'Admin',
      action: t('릴리스 승인', 'approved release'),
      item: 'Digital Dreams',
      time: t('1시간 전', '1 hour ago')
    },
    {
      id: 4,
      type: 'payment',
      user: 'Lee Suhyun',
      action: t('결제 완료', 'completed payment'),
      item: '₩150,000',
      time: t('2시간 전', '2 hours ago')
    }
  ]

  const topArtists = [
    { name: 'AURORA', releases: 15, revenue: '₩3.2M', growth: '+18%' },
    { name: 'SYNTHWAVE', releases: 12, revenue: '₩2.8M', growth: '+22%' },
    { name: 'CYBER', releases: 10, revenue: '₩2.1M', growth: '+15%' },
    { name: 'NEON', releases: 8, revenue: '₩1.9M', growth: '+12%' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return Music
      case 'user': return Users
      case 'approval': return FileText
      case 'payment': return DollarSign
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'submission': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
      case 'user': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'approval': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'payment': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {t('관리자 대시보드', 'Admin Dashboard')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('플랫폼 상태 및 통계를 한눈에 확인하세요', 'Monitor platform status and statistics at a glance')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="btn-glass btn-modern flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t('보고서 다운로드', 'Download Report')}
              </button>
              <div className="glass-effect px-4 py-2 rounded-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-effect rounded-2xl p-6 animate-fade-in-delay">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('수익 추이', 'Revenue Trend')}
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm glass-effect rounded-lg hover:shadow-md transition-all">
                  {t('일간', 'Daily')}
                </button>
                <button className="px-3 py-1 text-sm glass-effect-strong rounded-lg text-purple-600 dark:text-purple-400 shadow-md">
                  {t('월간', 'Monthly')}
                </button>
                <button className="px-3 py-1 text-sm glass-effect rounded-lg hover:shadow-md transition-all">
                  {t('연간', 'Yearly')}
                </button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center glass-effect rounded-xl">
              <BarChart3 className="w-16 h-16 text-gray-400" />
              <p className="ml-4 text-gray-500">{t('차트 영역', 'Chart Area')}</p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('최근 활동', 'Recent Activities')}
              </h2>
              <Link to="/admin/activities" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                <Eye className="w-5 h-5" />
              </Link>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start gap-3 animate-slide-in-right">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>
                        <span className="text-gray-600 dark:text-gray-400"> {activity.action}</span>
                        {activity.item && (
                          <span className="font-medium text-gray-900 dark:text-white"> {activity.item}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Artists */}
        <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('인기 아티스트', 'Top Artists')}
            </h2>
            <Link
              to="/admin/artists"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
            >
              {t('모두 보기', 'View all')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('아티스트', 'Artist')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('릴리스', 'Releases')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('수익', 'Revenue')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('성장률', 'Growth')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topArtists.map((artist, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors animate-slide-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                          {artist.name[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{artist.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                      {artist.releases}
                    </td>
                    <td className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {artist.revenue}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {artist.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/submissions"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('제출 관리', 'Manage Submissions')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('대기 중인 제출 검토', 'Review pending submissions')}
            </p>
          </Link>

          <Link
            to="/admin/customers"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('고객 관리', 'Customer Management')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('사용자 계정 관리', 'Manage user accounts')}
            </p>
          </Link>

          <Link
            to="/admin/analytics"
            className="card-glass p-6 hover-lift text-center group animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <PieChart className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('분석 및 인사이트', 'Analytics & Insights')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('상세 통계 확인', 'View detailed statistics')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}