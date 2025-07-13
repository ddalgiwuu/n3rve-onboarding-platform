import { useTranslation } from '@/store/language.store'
import { 
  Users, 
  Music, 
  TrendingUp, 
  FileText, 
  Activity,
  Download,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Loader
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [topArtists, setTopArtists] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load dashboard stats
      const stats = await adminService.getDashboardStats()
      setDashboardStats(stats)

      // Load activity logs
      try {
        const logs = await adminService.getActivityLogs({ limit: 5 })
        setActivityLogs(logs.logs || [])
      } catch (error) {
        // If activity logs fail, just continue
        console.error('Failed to load activity logs:', error)
      }

      // Load top artists - we'll use user data for now
      try {
        const users = await adminService.getUsers({ limit: 4 })
        const artistData = users.users.map(user => ({
          name: user.name || user.email,
          releases: user.submissions || 0,
          submissions: user.submissions || 0,
          growth: '+0%' // We'll calculate this when we have historical data
        }))
        setTopArtists(artistData)
      } catch (error) {
        // If artist data fails, just continue
        console.error('Failed to load artist data:', error)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error(t('대시보드 데이터 로드 실패', 'Failed to load dashboard data'))
    } finally {
      setIsLoading(false)
    }
  }

  const stats = dashboardStats ? [
    {
      label: t('총 사용자', 'Total Users'),
      value: dashboardStats.totalUsers?.toLocaleString() || '0',
      change: '+0%', // We'll calculate this when we have historical data
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      trend: 'up'
    },
    {
      label: t('총 제출', 'Total Submissions'),
      value: dashboardStats.totalSubmissions?.toLocaleString() || '0',
      change: '+0%',
      icon: Music,
      color: 'from-blue-500 to-cyan-500',
      trend: 'up'
    },
    {
      label: t('대기 중 검토', 'Pending Review'),
      value: dashboardStats.pendingReview?.toLocaleString() || '0',
      change: '+0%',
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      trend: 'down'
    }
  ] : []

  // Format activity logs for display
  const recentActivities = activityLogs.map(log => ({
    id: log.id || Math.random(),
    type: log.action?.includes('submission') ? 'submission' : 
          log.action?.includes('user') || log.action?.includes('login') ? 'user' :
          log.action?.includes('approval') || log.action?.includes('approved') ? 'approval' : 'activity',
    user: log.userName || log.userEmail || 'System',
    action: log.action || '',
    item: log.details || '',
    time: formatTimeAgo(log.createdAt)
  }))

  const formatTimeAgo = (date: string) => {
    if (!date) return t('방금 전', 'just now')
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
      return t(`${minutes}분 전`, `${minutes} minutes ago`)
    } else if (hours < 24) {
      return t(`${hours}시간 전`, `${hours} hours ago`)
    } else {
      return t(`${days}일 전`, `${days} days ago`)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return Music
      case 'user': return Users
      case 'approval': return FileText
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'submission': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
      case 'user': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'approval': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">{t('로딩 중...', 'Loading...')}</p>
        </div>
      </div>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          {/* Submission Trend Chart */}
          <div className="lg:col-span-2 glass-effect rounded-2xl p-6 animate-fade-in-delay">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('제출 추이', 'Submission Trend')}
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
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
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
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('최근 활동이 없습니다', 'No recent activities')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Artists */}
        <div className="glass-effect rounded-2xl p-6 animate-fade-in-delay">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('활성 사용자', 'Active Users')}
            </h2>
            <Link
              to="/admin/customers"
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
                    {t('이름', 'Name')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('릴리스', 'Releases')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('제출', 'Submissions')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {t('성장률', 'Growth')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topArtists.length > 0 ? (
                  topArtists.map((artist, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors animate-slide-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                            {artist.name[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{artist.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                        {artist.releases}
                      </td>
                      <td className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {artist.submissions}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {artist.growth}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {t('데이터가 없습니다', 'No data available')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>
    </div>
  )
}