import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Music2,
  Search,
  Filter,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface ReleaseProject {
  id: string;
  artistName: string;
  albumTitle: string;
  albumType: 'SINGLE' | 'EP' | 'ALBUM';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  releaseDate: string;
  files: {
    coverImageUrl?: string;
  };
  release: {
    upc?: string;
  };
  labelName?: string;
  createdAt: string;
  // Marketing fields
  hook?: string;
  mainPitch?: string;
  moods?: string[];
  priority?: number;
}

export default function ReleaseProjects() {
  const { language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  // Translation helper
  const translate = (ko: string, en: string, ja: string) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Fetch submissions
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['release-projects'],
    queryFn: async () => {
      try {
        const endpoint = isAdmin
          ? '/admin/submissions'
          : '/submissions/user';

        const response = await api.get(endpoint);
        return response.data;
      } catch (err) {
        console.error('Error fetching projects:', err);
        if (err.response?.status === 401) return [];
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p: ReleaseProject) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p: ReleaseProject) =>
        p.artistName.toLowerCase().includes(query) ||
        p.albumTitle.toLowerCase().includes(query) ||
        p.release?.upc?.includes(query)
      );
    }

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: translate('승인됨', 'Approved', '承認済み') };
      case 'REJECTED':
        return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: translate('거부됨', 'Rejected', '却下') };
      default:
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: translate('대기중', 'Pending', '保留中') };
    }
  };

  const handleOpenDetails = (project: ReleaseProject) => {
    navigate(`/marketing-submission/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Music2 size={32} className="text-purple-500 dark:text-purple-400" />
            {translate('릴리즈 프로젝트', 'Release Projects', 'リリースプロジェクト')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {translate('제출한 모든 프로젝트를 확인하고 마케팅 정보를 관리하세요', 'View all your projects and manage marketing information', '全てのプロジェクトを確認し、マーケティング情報を管理')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {translate('전체 프로젝트', 'Total Projects', '全プロジェクト')}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {translate('승인됨', 'Approved', '承認済み')}
            </p>
            <p className="text-3xl font-bold text-green-400">
              {projects.filter((p: ReleaseProject) => p.status === 'APPROVED').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {translate('대기중', 'Pending', '保留中')}
            </p>
            <p className="text-3xl font-bold text-yellow-400">
              {projects.filter((p: ReleaseProject) => p.status === 'PENDING').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {translate('마케팅 완료', 'Marketing Complete', 'マーケティング完了')}
            </p>
            <p className="text-3xl font-bold text-purple-400">
              {projects.filter((p: ReleaseProject) => p.hook && p.mainPitch).length}
            </p>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate('아티스트, 앨범명, UPC로 검색...', 'Search by artist, album, UPC...', 'アーティスト、アルバム、UPCで検索...')}
              className="
                w-full pl-12 pr-4 py-3
                bg-white/80 dark:bg-white/5 backdrop-blur-md
                border border-gray-300 dark:border-white/10 rounded-xl
                text-gray-900 dark:text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  statusFilter === status
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                )}
              >
                {status === 'all' ? translate('전체', 'All', '全て') : status}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">
              {translate('로딩 중...', 'Loading...', '読み込み中...')}
            </p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: ReleaseProject, index: number) => {
              const statusConfig = getStatusConfig(project.status);
              const hasMarketing = project.hook && project.mainPitch;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="
                    group relative overflow-hidden rounded-2xl
                    bg-white/80 dark:bg-white/5 backdrop-blur-xl
                    border border-gray-200 dark:border-white/10
                    hover:border-purple-500 dark:hover:border-purple-500/30
                    hover:bg-white dark:hover:bg-white/10
                    transition-all cursor-pointer
                  "
                  onClick={() => handleOpenDetails(project)}
                >
                  {/* Cover Image */}
                  <div className="aspect-square relative overflow-hidden bg-gray-800">
                    {project.files?.coverImageUrl ? (
                      <img
                        src={project.files.coverImageUrl}
                        alt={project.albumTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Music2 size={64} className="text-gray-600" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <div className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-md',
                        statusConfig.color,
                        statusConfig.bg,
                        statusConfig.border
                      )}>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Marketing status */}
                    {hasMarketing && (
                      <div className="absolute top-3 left-3">
                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 border border-blue-500/30 text-blue-300 backdrop-blur-md">
                          {translate('마케팅 완료', 'Marketing', 'マーケティング')} ✓
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">
                        {project.albumTitle}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-400">{project.artistName}</p>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-xs">
                      {project.labelName && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Building2 size={14} />
                          <span className="truncate">{project.labelName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>{new Date(project.releaseDate).toLocaleDateString()}</span>
                      </div>

                      {project.release?.upc && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="font-mono">UPC: {project.release.upc}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          project.albumType === 'SINGLE' ? 'bg-blue-500/20 text-blue-400' :
                            project.albumType === 'EP' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-pink-500/20 text-pink-400'
                        )}>
                          {project.albumType}
                        </span>
                      </div>
                    </div>

                    {/* Open Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(project);
                      }}
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-3 rounded-xl
                        bg-gradient-to-r from-purple-500 to-pink-500
                        hover:shadow-lg hover:shadow-purple-500/50
                        text-white font-medium
                        transition-all
                      "
                    >
                      <ExternalLink size={18} />
                      {translate('마케팅 정보 입력', 'Add Marketing Info', 'マーケティング情報を入力')}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-2xl">
            <Music2 size={64} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {translate('프로젝트가 없습니다', 'No Projects Yet', 'プロジェクトがありません')}
            </h3>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              {searchQuery
                ? translate('검색 결과가 없습니다', 'No projects match your search', '検索結果がありません')
                : translate('새 릴리즈를 제출하면 여기에 표시됩니다', 'Submit a new release to see it here', '新しいリリースを提出するとここに表示されます')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
