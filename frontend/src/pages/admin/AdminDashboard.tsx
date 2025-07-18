import { useState, useEffect } from 'react'
import { ClipboardList, Users, CheckCircle, XCircle, Calendar, Music, Eye, Download, Search, Filter, Clock, Settings } from 'lucide-react'
import { submissionService } from '@/services/submission.service'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalCustomers: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load statistics
      const statsData = await submissionService.getSubmissionStats()
      setStats(statsData)
      
      // Load recent submissions
      const submissionsData = await submissionService.getAllSubmissions({
        limit: 10,
        page: 1
      })
      setRecentSubmissions(submissionsData.submissions || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-n3rve-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            {t('관리자 대시보드', 'Admin Dashboard')}
          </h1>
          <button
            onClick={() => submissionService.exportSubmissions()}
            className="px-4 py-2 bg-gradient-to-r from-n3rve-500 to-purple-600 hover:from-n3rve-600 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Download className="w-4 h-4" />
            {t('엑셀 다운로드', 'Export to Excel')}
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">{t('전체 제출', 'Total Submissions')}</p>
                <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalSubmissions}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg">
                <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">{t('검토 대기', 'Pending Review')}</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
              </div>
              <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">{t('승인됨', 'Approved')}</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">{t('반려됨', 'Rejected')}</p>
                <p className="text-2xl md:text-3xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <div className="p-2 md:p-3 bg-red-500/20 rounded-lg">
                <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">{t('전체 사용자', 'Total Users')}</p>
                <p className="text-2xl md:text-3xl font-bold text-n3rve-400">{stats.totalCustomers}</p>
              </div>
              <div className="p-2 md:p-3 bg-n3rve-500/20 rounded-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-n3rve-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('아티스트, 앨범, 제출자 검색...', 'Search artist, album, submitter...')}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent"
            >
              <option value="all">{t('전체 상태', 'All Status')}</option>
              <option value="pending">{t('대기 중', 'Pending')}</option>
              <option value="approved">{t('승인됨', 'Approved')}</option>
              <option value="rejected">{t('반려됨', 'Rejected')}</option>
            </select>
          </div>
        </div>

        {/* 최근 제출 목록 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-bold text-white">{t('최근 제출 내역', 'Recent Submissions')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4 text-gray-300 font-medium">{t('제출일', 'Date')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium">{t('아티스트', 'Artist')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium">{t('앨범명', 'Album')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium">{t('제출자', 'Submitter')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium">{t('상태', 'Status')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium">{t('작업', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-400">
                      {t('제출된 데이터가 없습니다', 'No submissions found')}
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-200">{formatDate(submission.createdAt)}</td>
                      <td className="p-4 text-gray-200">{submission.artist?.name || '-'}</td>
                      <td className="p-4 text-gray-200">{submission.album?.title || '-'}</td>
                      <td className="p-4 text-gray-200">
                        <div>
                          <div className="text-sm">{submission.submitterName}</div>
                          <div className="text-xs text-gray-400">{submission.submitterEmail}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(submission.status)}`}>
                          {t(
                            submission.status === 'approved' ? '승인됨' : 
                            submission.status === 'rejected' ? '반려됨' : '대기 중',
                            submission.status.charAt(0).toUpperCase() + submission.status.slice(1)
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                          className="px-3 py-1 bg-n3rve-500 hover:bg-n3rve-600 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {t('상세보기', 'View')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 더보기 버튼 */}
          <div className="p-4 border-t border-white/20 text-center">
            <button
              onClick={() => navigate('/admin/submissions')}
              className="text-n3rve-400 hover:text-n3rve-300 font-medium transition-colors"
            >
              {t('모든 제출 보기 →', 'View All Submissions →')}
            </button>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => navigate('/admin/submissions')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Music className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('제출 관리', 'Manage Submissions')}</h3>
            <p className="text-sm text-gray-400">{t('모든 제출 내역 검토 및 관리', 'Review and manage all submissions')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('사용자 관리', 'Manage Users')}</h3>
            <p className="text-sm text-gray-400">{t('사용자 계정 및 권한 관리', 'Manage user accounts and permissions')}</p>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Settings className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('플랫폼 설정', 'Platform Settings')}</h3>
            <p className="text-sm text-gray-400">{t('시스템 설정 및 구성 관리', 'Manage system settings and configuration')}</p>
          </button>
        </div>
      </div>
    </div>
  )
}