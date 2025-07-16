import { useState } from 'react'
import { X, Plus, Trash2, Music2, Edit3, Mic2, Headphones, Piano } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'

interface Contributor {
  id: string
  name: string
  role: 'composer' | 'lyricist' | 'arranger' | 'producer' | 'engineer' | 'performer'
  instrument?: string
  description?: string
}

interface ContributorManagementModalProps {
  isOpen: boolean
  onClose: () => void
  contributors: Contributor[]
  onSave: (contributors: Contributor[]) => void
  trackTitle?: string
}

const roleIcons = {
  composer: Music2,
  lyricist: Edit3,
  arranger: Piano,
  producer: Headphones,
  engineer: Headphones,
  performer: Mic2
}

export default function ContributorManagementModal({
  isOpen,
  onClose,
  contributors: initialContributors,
  onSave,
  trackTitle
}: ContributorManagementModalProps) {
  const { language } = useLanguageStore()
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  const [contributors, setContributors] = useState<Contributor[]>(initialContributors)
  const [newContributor, setNewContributor] = useState<Partial<Contributor>>({
    name: '',
    role: 'composer',
    instrument: '',
    description: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const roleLabels = {
    composer: t('작곡가', 'Composer'),
    lyricist: t('작사가', 'Lyricist'),
    arranger: t('편곡자', 'Arranger'),
    producer: t('프로듀서', 'Producer'),
    engineer: t('엔지니어', 'Engineer'),
    performer: t('연주자', 'Performer')
  }

  const validateContributor = () => {
    const errs: string[] = []
    if (!newContributor.name?.trim()) {
      errs.push(t('기여자 이름을 입력하세요', 'Please enter contributor name'))
    }
    if (newContributor.role === 'performer' && !newContributor.instrument?.trim()) {
      errs.push(t('악기를 입력하세요', 'Please enter instrument'))
    }
    setErrors(errs)
    return errs.length === 0
  }

  const addContributor = () => {
    if (validateContributor()) {
      const contributor: Contributor = {
        id: Date.now().toString(),
        name: newContributor.name!.trim(),
        role: newContributor.role as Contributor['role'],
        instrument: newContributor.instrument?.trim(),
        description: newContributor.description?.trim()
      }
      setContributors([...contributors, contributor])
      setNewContributor({ name: '', role: 'composer', instrument: '', description: '' })
      setErrors([])
    }
  }

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id))
  }

  const handleSave = () => {
    onSave(contributors)
    onClose()
  }

  if (!isOpen) return null

  const groupedContributors = contributors.reduce((acc, contributor) => {
    if (!acc[contributor.role]) {
      acc[contributor.role] = []
    }
    acc[contributor.role].push(contributor)
    return acc
  }, {} as Record<string, Contributor[]>)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('기여자 관리', 'Manage Contributors')}
            </h2>
            {trackTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {trackTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Add New Contributor */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {t('새 기여자 추가', 'Add New Contributor')}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('이름', 'Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newContributor.name || ''}
                    onChange={(e) => setNewContributor({ ...newContributor, name: e.target.value })}
                    placeholder={t('기여자 이름 입력', 'Enter contributor name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('역할', 'Role')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newContributor.role}
                    onChange={(e) => setNewContributor({ ...newContributor, role: e.target.value as Contributor['role'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newContributor.role === 'performer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('악기', 'Instrument')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newContributor.instrument || ''}
                    onChange={(e) => setNewContributor({ ...newContributor, instrument: e.target.value })}
                    placeholder={t('예: 기타, 피아노, 드럼', 'e.g., Guitar, Piano, Drums')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('추가 정보', 'Additional Info')} {t('(선택사항)', '(Optional)')}
                </label>
                <input
                  type="text"
                  value={newContributor.description || ''}
                  onChange={(e) => setNewContributor({ ...newContributor, description: e.target.value })}
                  placeholder={t('예: 메인 프로듀서, 공동 작곡', 'e.g., Main Producer, Co-writer')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                />
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {errors.map((err, idx) => <p key={idx}>{err}</p>)}
                </div>
              )}

              <button
                onClick={addContributor}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('기여자 추가', 'Add Contributor')}
              </button>
            </div>
          </div>

          {/* Contributor List by Role */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('등록된 기여자', 'Registered Contributors')} ({contributors.length})
            </h3>
            
            {contributors.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('등록된 기여자가 없습니다', 'No contributors registered')}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedContributors).map(([role, roleContributors]) => {
                  const Icon = roleIcons[role as keyof typeof roleIcons]
                  return (
                    <div key={role}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {roleLabels[role as keyof typeof roleLabels]}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {roleContributors.map((contributor) => (
                          <div
                            key={contributor.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {contributor.name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                {contributor.instrument && (
                                  <span>{contributor.instrument}</span>
                                )}
                                {contributor.description && (
                                  <span>• {contributor.description}</span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeContributor(contributor.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('작곡가와 작사가는 저작권 관리에 중요합니다', 'Composers and lyricists are important for copyright management')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('취소', 'Cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('저장', 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}