import { useState, useEffect } from 'react'
import { Search, Globe, Play, Download, Video, Radio, Users, Settings, BarChart3 } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'
import api from '@/lib/api'

interface DSP {
  id: string
  dspId: string
  name: string
  code?: string
  description?: string
  contactEmail?: string
  territories: string[]
  availability: string
  isActive: boolean
  isHD: boolean
  serviceType: 'STREAMING' | 'DOWNLOAD' | 'FINGERPRINTING' | 'VIDEO' | 'RADIO' | 'SOCIAL' | 'OTHER'
  createdAt: string
  updatedAt: string
}

interface DSPStats {
  total: number
  active: number
  inactive: number
  byServiceType: Array<{
    type: string
    count: number
  }>
}

const ServiceTypeIcons = {
  STREAMING: Play,
  DOWNLOAD: Download,
  VIDEO: Video,
  RADIO: Radio,
  SOCIAL: Users,
  FINGERPRINTING: Settings,
  OTHER: Settings
}

const ServiceTypeColors = {
  STREAMING: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  DOWNLOAD: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  VIDEO: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  RADIO: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  SOCIAL: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
  FINGERPRINTING: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  OTHER: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
}

export default function DSPList() {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en

  const [dsps, setDsps] = useState<DSP[]>([])
  const [stats, setStats] = useState<DSPStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [showInactive, setShowInactive] = useState(false)

  // Fetch DSPs
  const fetchDSPs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedServiceType) params.append('serviceType', selectedServiceType)
      if (showInactive !== undefined) params.append('isActive', (!showInactive).toString())
      params.append('limit', '100')

      const response = await api.get(`/dsp?${params.toString()}`)
      setDsps(response.data.dsps)
    } catch (error) {
      console.error('Error fetching DSPs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/dsp/statistics')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching DSP statistics:', error)
    }
  }

  useEffect(() => {
    fetchDSPs()
    fetchStats()
  }, [searchQuery, selectedServiceType, showInactive])

  const getTerritoryText = (territories: string[]) => {
    if (territories.includes('World')) return t('전세계', 'Worldwide')
    return territories.join(', ')
  }

  const formatDescription = (description?: string) => {
    if (!description) return null
    return description.length > 150 ? description.substring(0, 150) + '...' : description
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('DSP 관리', 'DSP Management')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('디지털 서비스 제공업체 목록을 관리합니다', 'Manage digital service provider listings')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            {t('DSP 추가', 'Add DSP')}
          </button>
          <button 
            onClick={() => fetchDSPs()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('새로고침', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('전체 DSP', 'Total DSPs')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('활성', 'Active')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('비활성', 'Inactive')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('서비스 유형', 'Service Types')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byServiceType.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              placeholder={t('DSP 검색...', 'Search DSPs...')}
            />
          </div>

          {/* Service Type Filter */}
          <select
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
          >
            <option value="">{t('모든 서비스 유형', 'All Service Types')}</option>
            <option value="STREAMING">{t('스트리밍', 'Streaming')}</option>
            <option value="DOWNLOAD">{t('다운로드', 'Download')}</option>
            <option value="VIDEO">{t('비디오', 'Video')}</option>
            <option value="RADIO">{t('라디오', 'Radio')}</option>
            <option value="SOCIAL">{t('소셜', 'Social')}</option>
            <option value="FINGERPRINTING">{t('핑거프린팅', 'Fingerprinting')}</option>
            <option value="OTHER">{t('기타', 'Other')}</option>
          </select>

          {/* Show Inactive Toggle */}
          <label className="flex items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-purple-500"
            />
            <span className="text-sm">{t('비활성 포함', 'Include Inactive')}</span>
          </label>
        </div>
      </div>

      {/* DSP List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('로딩 중...', 'Loading...')}</p>
          </div>
        ) : dsps.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t('DSP가 없습니다', 'No DSPs found')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {dsps.map((dsp) => {
              const IconComponent = ServiceTypeIcons[dsp.serviceType]
              const colorClasses = ServiceTypeColors[dsp.serviceType]
              
              return (
                <div key={dsp.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Service Type Icon */}
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* DSP Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {dsp.name}
                          </h3>
                          {dsp.code && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                              {dsp.code}
                            </span>
                          )}
                          {dsp.isHD && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded font-medium">
                              HD
                            </span>
                          )}
                          {!dsp.isActive && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
                              {t('비활성', 'Inactive')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {getTerritoryText(dsp.territories)}
                          </span>
                          <span>ID: {dsp.dspId}</span>
                          {dsp.contactEmail && (
                            <span>{dsp.contactEmail}</span>
                          )}
                        </div>

                        {dsp.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {formatDescription(dsp.description)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t(
            `총 ${dsps.length}개의 DSP 표시됨`,
            `Showing ${dsps.length} DSPs`
          )}
        </div>
      )}
    </div>
  )
}