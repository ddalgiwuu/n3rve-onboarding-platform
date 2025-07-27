import { useState } from 'react';
import { X, Plus, Trash2, Users, Music2, Edit3, Mic2 } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import ContributorForm from './ContributorForm';
import contributorRolesData from '@/data/contributorRoles.json';
import instrumentsData from '@/data/instruments.json';
import roleTranslations from '@/data/contributorRolesTranslations.json';
import instrumentTranslations from '@/data/instrumentTranslations.json';

interface Translation {
  id: string
  language: string
  name: string
}

interface PlatformIdentifier {
  type: 'spotify' | 'apple'
  value: string
  url?: string
}

interface Contributor {
  id: string
  name: string
  translations: Translation[]
  roles: string[]
  instruments: string[]
  identifiers: PlatformIdentifier[]
  isNewArtist: boolean
}

interface ContributorManagementModalProps {
  isOpen: boolean
  onClose: () => void
  contributors: Contributor[]
  onSave: (contributors: Contributor[]) => void
  trackTitle?: string
}

export default function ContributorManagementModal({
  isOpen,
  onClose,
  contributors: initialContributors,
  onSave,
  trackTitle
}: ContributorManagementModalProps) {
  const { language } = useLanguageStore();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [contributors, setContributors] = useState<Contributor[]>(initialContributors);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Get role icons based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Composition': return Edit3;
      case 'Performance': return Mic2;
      case 'Production': return Music2;
      default: return Users;
    }
  };

  const addContributor = (contributor: Contributor) => {
    setContributors([...contributors, contributor]);
    setShowAddForm(false);
  };

  const updateContributor = (updatedContributor: Contributor) => {
    setContributors(contributors.map(c =>
      c.id === updatedContributor.id ? updatedContributor : c
    ));
    setEditingContributor(null);
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onSave(contributors);
    onClose();
  };

  if (!isOpen) return null;

  // Group contributors by their primary role category
  const groupedContributors = contributors.reduce((acc, contributor) => {
    if (contributor.roles.length > 0) {
      const primaryRoleId = contributor.roles[0];
      const primaryRole = contributorRolesData.roles.find(r => r.id === primaryRoleId);
      const category = primaryRole?.category || 'Other';

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(contributor);
    }
    return acc;
  }, {} as Record<string, Contributor[]>);

  const getRoleName = (roleId: string) => {
    const role = contributorRolesData.roles.find(r => r.id === roleId);
    const roleName = role?.name || roleId;

    // Get translation if available
    const translation = roleTranslations.roleTranslations[roleId];
    if (translation && language === 'ko') {
      return `${translation.ko} (${roleName})`;
    } else if (translation && language === 'ja') {
      return `${translation.ja} (${roleName})`;
    }

    return roleName;
  };

  const getInstrumentName = (instrumentId: string) => {
    const instrument = instrumentsData.instruments.find(i => i.id === instrumentId);
    const instrumentName = instrument?.name || instrumentId;

    // Get translation if available
    const translation = instrumentTranslations.instrumentTranslations[instrumentId];
    if (translation && language === 'ko') {
      return `${translation.ko} (${instrumentName})`;
    } else if (translation && language === 'ja') {
      return `${translation.ja} (${instrumentName})`;
    }

    return instrumentName;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('기여자 관리', 'Contributor Management')}
              </h2>
              {trackTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('트랙:', 'Track:')} {trackTitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {editingContributor ? (
            <ContributorForm
              contributor={editingContributor}
              onSave={updateContributor}
              onCancel={() => setEditingContributor(null)}
            />
          ) : showAddForm ? (
            <ContributorForm
              onSave={addContributor}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <>
              {/* Add New Contributor Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-6 px-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-purple-600 dark:text-purple-400 font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('새 기여자 추가', 'Add New Contributor')}
              </button>

              {/* Contributors List */}
              {Object.keys(groupedContributors).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedContributors).map(([category, categoryContributors]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <CategoryIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {(() => {
                              const categoryTranslation = roleTranslations.categoryTranslations[category];
                              if (categoryTranslation && language === 'ko') {
                                return categoryTranslation.ko;
                              } else if (categoryTranslation && language === 'ja') {
                                return categoryTranslation.ja;
                              }
                              return category;
                            })()}
                          </h3>
                          <span className="text-sm text-gray-500">({categoryContributors.length})</span>
                        </div>

                        <div className="grid gap-3">
                          {categoryContributors.map(contributor => (
                            <div
                              key={contributor.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {contributor.name}
                                    </h4>
                                    {contributor.isNewArtist && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                        {t('신규', 'New')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Roles */}
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {contributor.roles.map(roleId => (
                                      <span
                                        key={roleId}
                                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg"
                                      >
                                        {getRoleName(roleId)}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Instruments */}
                                  {contributor.instruments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {contributor.instruments.map(instrumentId => (
                                        <span
                                          key={instrumentId}
                                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg"
                                        >
                                          {getInstrumentName(instrumentId)}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Identifiers */}
                                  {contributor.identifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {contributor.identifiers.map((identifier, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs text-gray-600 dark:text-gray-400"
                                        >
                                          {identifier.type.toUpperCase()}: {identifier.value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingContributor(contributor)}
                                    className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeContributor(contributor.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('아직 기여자가 없습니다', 'No contributors yet')}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t('위의 버튼을 클릭하여 기여자를 추가하세요', 'Click the button above to add contributors')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!editingContributor && !showAddForm && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  `총 ${contributors.length}명의 기여자 | ${contributorRolesData.roles.length}개 역할 | ${instrumentsData.instruments.length}개 악기 사용 가능`,
                  `Total ${contributors.length} contributors | ${contributorRolesData.roles.length} roles | ${instrumentsData.instruments.length} instruments available`
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('취소', 'Cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  {t('저장', 'Save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
