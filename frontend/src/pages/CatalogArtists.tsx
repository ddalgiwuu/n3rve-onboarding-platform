import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import catalogApi from '../lib/catalog-api';
import type { CatalogArtist } from '../types/catalog';
import toast from 'react-hot-toast';

export default function CatalogArtistsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ARTIST' | 'CONTRIBUTOR'>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-artists', search, typeFilter, page],
    queryFn: () => catalogApi.getArtists({
      search: search || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      page,
      limit: 60,
    }).then(r => r.data),
  });

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

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Users size={32} className="text-purple-500 dark:text-purple-400" />
            카탈로그 아티스트 & 기여자
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            FUGA 카탈로그에 등록된 아티스트 및 기여자를 관리합니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">전체</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.total || 0}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">아티스트</p>
            <p className="text-3xl font-bold text-blue-400">
              {artists.filter((a: CatalogArtist) => a.type === 'ARTIST').length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl"
          >
            <p className="text-gray-400 text-sm mb-1">기여자</p>
            <p className="text-3xl font-bold text-yellow-400">
              {artists.filter((a: CatalogArtist) => a.type === 'CONTRIBUTOR').length}
            </p>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="이름 검색..."
              className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            {(['all', 'ARTIST', 'CONTRIBUTOR'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setTypeFilter(type); setPage(1); }}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  typeFilter === type
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                )}
              >
                {type === 'all' ? '전체' : type === 'ARTIST' ? '아티스트' : '기여자'}
              </button>
            ))}
          </div>
        </div>

        {/* Artists Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : artists.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {artists.map((artist: CatalogArtist, index: number) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={clsx(
                  'relative overflow-hidden rounded-2xl cursor-pointer',
                  'bg-white/80 dark:bg-white/5 backdrop-blur-xl',
                  'border border-gray-200 dark:border-white/10',
                  'hover:border-purple-500 dark:hover:border-purple-500/30',
                  'hover:bg-white dark:hover:bg-white/10',
                  'transition-all group'
                )}
                onClick={() => navigate(`/admin/catalog/artists/${artist.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  {/* Avatar + Type badge */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {artist.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-lg text-xs font-medium border',
                      artist.type === 'ARTIST'
                        ? 'text-blue-400 bg-blue-500/20 border-blue-500/30'
                        : 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
                    )}>
                      {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {artist.name}
                  </h3>

                  {artist.countryOfOrigin && (
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">{artist.countryOfOrigin}</p>
                  )}

                  {/* Roles */}
                  {artist.roles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {artist.roles.slice(0, 3).map(role => (
                        <span key={role} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                          {role}
                        </span>
                      ))}
                      {artist.roles.length > 3 && (
                        <span className="text-xs text-zinc-400">+{artist.roles.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-lg font-bold text-white">
                        {artist.genres?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400">Genres</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-lg font-bold text-purple-400">
                        {artist.labels?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400">Labels</p>
                    </div>
                  </div>

                  {/* Detail button */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/catalog/artists/${artist.id}`); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-medium text-sm transition-all"
                    >
                      상세 보기
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(artist.id); }}
                      className="flex items-center justify-center px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-2xl">
            <Users size={64} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              결과 없음
            </h3>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">총 {data.total}명</p>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                이전
              </button>
              <button
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingId(null)}>
          <div className="rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-white">아티스트 삭제</h3>
            <p className="mt-2 text-sm text-zinc-500">정말 이 아티스트를 삭제하시겠습니까?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeletingId(null)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700 dark:text-white">취소</button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
