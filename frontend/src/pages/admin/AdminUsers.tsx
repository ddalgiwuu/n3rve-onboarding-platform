import { useState, useEffect } from 'react'
import { Users, Search, Shield, UserCheck, UserX, Mail, Phone, Calendar, Building, Clock } from 'lucide-react'
import { usersService } from '@/services/users.service'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminUsers() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [currentPage, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersService.getAllUsers({
        searchQuery,
        role: roleFilter,
        page: currentPage,
        limit: 20
      })
      
      // Add defensive programming
      if (!data || !Array.isArray(data.users)) {
        console.error('Invalid response format:', data)
        setUsers([])
        setTotalPages(1)
        return
      }
      
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      await usersService.updateUserRole(userId, newRole)
      await loadUsers() // Reload users
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await usersService.updateUserStatus(userId, isActive)
      await loadUsers() // Reload users
    } catch (error) {
      console.error('Failed to update user status:', error)
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

  if (loading && users.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-n3rve-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-n3rve-400" />
            {t('사용자 관리', 'User Management')}
          </h1>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-sm dark:backdrop-blur-md rounded-xl p-6 border border-gray-200 dark:border-white/20 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
                placeholder={t('이름, 이메일, 회사 검색...', 'Search name, email, company...')}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent"
            >
              <option value="all">{t('전체 권한', 'All Roles')}</option>
              <option value="USER">{t('일반 사용자', 'User')}</option>
              <option value="ADMIN">{t('관리자', 'Admin')}</option>
            </select>
            <button
              onClick={loadUsers}
              className="px-6 py-3 bg-n3rve-500 hover:bg-n3rve-600 text-white rounded-lg transition-colors"
            >
              {t('검색', 'Search')}
            </button>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-sm dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('사용자', 'User')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('회사', 'Company')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('권한', 'Role')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('상태', 'Status')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('가입일', 'Joined')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('마지막 로그인', 'Last Login')}</th>
                  <th className="text-left p-4 text-gray-300 font-medium whitespace-nowrap">{t('작업', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-400">
                      {t('사용자가 없습니다', 'No users found')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-n3rve-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{user.name || 'No name'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-200">
                        {user.company ? (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            {user.company}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                            user.role === 'ADMIN' 
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          <option value="USER">{t('일반 사용자', 'User')}</option>
                          <option value="ADMIN">{t('관리자', 'Admin')}</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleStatusChange(user.id, !user.isActive)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                            user.isActive 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {user.isActive ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4" />
                              {t('활성', 'Active')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserX className="w-4 h-4" />
                              {t('비활성', 'Inactive')}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-200">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-200">
                        {user.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatDate(user.lastLoginAt)}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'ADMIN' && (
                            <Shield className="w-4 h-4 text-purple-400" title={t('관리자', 'Admin')} />
                          )}
                          {!user.isProfileComplete && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                              {t('프로필 미완성', 'Incomplete')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/20 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {t('이전', 'Previous')}
              </button>
              <span className="text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {t('다음', 'Next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}