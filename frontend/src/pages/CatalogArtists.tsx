import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Search, Trash2, Music, Mic2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import catalogApi from '../lib/catalog-api';
import type { CatalogArtist } from '../types/catalog';
import toast from 'react-hot-toast';

export default function CatalogArtistsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  const [typeFilter, setTypeFilter] = useState<'all' | 'ARTIST' | 'CONTRIBUTOR'>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (urlSearch) setSearch(urlSearch);
  }, [urlSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-artists', search, typeFilter, page],
    queryFn: () => catalogApi.getArtists({
      search: search || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      page,
      limit: 60,
    }).then(r => r.data),
  });

  useEffect(() => {
    if (urlSearch && data?.data?.length === 1) {
      navigate(`/admin/catalog/artists/${data.data[0].id}`, { replace: true });
    }
  }, [urlSearch, data, navigate]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteArtist(id),
    onSuccess: () => {
      toast.success('아티스트가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['catalog-artists'] });
      setDeletingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || '삭제 실패'),
  });

  const artists = data?.data || [];
  const totalArtists = artists.filter((a: CatalogArtist) => a.type === 'ARTIST').length;
  const totalContributors = artists.filter((a: CatalogArtist) => a.type === 'CONTRIBUTOR').length;

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="w-full max-w-[1600px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              카탈로그 아티스트
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-[52px]">
              {data?.total || 0}명 등록됨
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 ml-[52px] md:ml-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Music size={14} className="text-blue-400" />
              <span className="text-sm font-medium text-blue-400">{totalArtists} Artists</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Mic2 size={14} className="text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{totalContributors} Contributors</span>
            </div>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="아티스트 이름 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-white/5 sm:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white/60 dark:bg-white/5 sm:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl">
            {(['all', 'ARTIST', 'CONTRIBUTOR'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setTypeFilter(type); setPage(1); }}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  typeFilter === type
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                )}
              >
                {type === 'all' ? '전체' : type === 'ARTIST' ? 'Artist' : 'Contributor'}
              </button>
            ))}
          </div>
        </div>

        {/* Artists Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : artists.length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
              {artists.map((artist: CatalogArtist) => (
                <div
                  key={artist.id}
                  className={clsx(
                    'relative overflow-hidden rounded-2xl cursor-pointer group',
                    'bg-white dark:bg-zinc-800/80 sm:backdrop-blur-xl',
                    'border border-gray-100 dark:border-zinc-700/60',
                    'hover:border-purple-400/50 dark:hover:border-purple-500/40',
                    'hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/5',
                    'transition-all duration-200 hover:-translate-y-1'
                  )}
                  onClick={() => navigate(`/admin/catalog/artists/${artist.id}`)}
                >
                  {/* Card content - fixed height layout */}
                  <div className="p-4 flex flex-col h-full">
                    {/* Avatar row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={clsx(
                        'w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md',
                        artist.type === 'ARTIST'
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                          : 'bg-gradient-to-br from-amber-500 to-orange-600'
                      )}>
                        {artist.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                          {artist.name}
                        </h3>
                        <span className={clsx(
                          'inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                          artist.type === 'ARTIST'
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15'
                        )}>
                          {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                        </span>
                      </div>
                    </div>

                    {/* Roles - max 2 lines */}
                    <div className="min-h-[24px] mb-2">
                      {artist.roles?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {artist.roles.slice(0, 2).map(role => (
                            <span key={role} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
                              {role}
                            </span>
                          ))}
                          {artist.roles.length > 2 && (
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 self-center">+{artist.roles.length - 2}</span>
                          )}
                        </div>
                      ) : (artist as any).labels?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(artist as any).labels.slice(0, 2).map((label: string) => (
                            <span key={label} className="rounded-md bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Hover action bar */}
                    <div className="mt-auto pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="flex items-center gap-1 text-[11px] text-purple-500 dark:text-purple-400 font-medium">
                        <ExternalLink size={12} /> 상세
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingId(artist.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/60 dark:bg-white/5 sm:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl">
            <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">결과 없음</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              {page} / {data.totalPages} 페이지 (총 {data.total}명)
            </p>
            <div className="flex gap-1.5">
              <button
                className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={14} /> 이전
              </button>
              <button
                className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                다음 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">아티스트 삭제</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 text-center">이 작업은 되돌릴 수 없습니다.</p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingId)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
