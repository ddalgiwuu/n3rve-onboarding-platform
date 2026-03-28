import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Users, Disc3, Building2, Link2, Unlink, LayoutGrid, List, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import { useTranslation } from '../hooks/useTranslation';

function StateTag({ state }: { state: string }) {
  const colors: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[state] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
      {state}
    </span>
  );
}

function FormatTag({ format }: { format?: string }) {
  if (!format) return null;
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {format}
    </span>
  );
}

function SourceBadge({ source }: { source?: string }) {
  if (source === 'both') return <span className="rounded-full bg-blue-500/80 px-2 py-0.5 text-xs text-white">Synced</span>;
  if (source === 'catalog') return <span className="rounded-full bg-green-500/80 px-2 py-0.5 text-xs text-white">N3RVE</span>;
  if (source === 'submission') return <span className="rounded-full bg-orange-500/80 px-2 py-0.5 text-xs text-white">제출</span>;
  return null;
}

function SubmissionStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = status === 'APPROVED'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : status === 'PENDING'
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('tile');
  const [page, setPage] = useState(1);
  const [isPulling, setIsPulling] = useState(false);

  const handlePullFromFuga = async () => {
    setIsPulling(true);
    try {
      const result = await catalogApi.pullFromFuga();
      toast.success(`동기화 완료: ${result.data?.created || 0}개 생성, ${result.data?.updated || 0}개 업데이트`);
      queryClient.invalidateQueries({ queryKey: ['catalog-unified'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-infinite'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'FUGA 동기화 실패');
    } finally {
      setIsPulling(false);
    }
  };

  // Table view: paginated query
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog-unified', search, stateFilter, formatFilter, sourceFilter, page],
    queryFn: () => catalogApi.getUnifiedProducts({
      search: search || undefined,
      state: stateFilter || undefined,
      format: formatFilter || undefined,
      source: sourceFilter || undefined,
      page,
      limit: viewMode === 'tile' ? 40 : 20,
    }).then(r => r.data),
    enabled: viewMode === 'table',
  });

  // Tile view: infinite scroll
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['catalog-infinite', search, stateFilter, formatFilter, sourceFilter],
    queryFn: ({ pageParam = 1 }) => catalogApi.getUnifiedProducts({
      search: search || undefined,
      state: stateFilter || undefined,
      format: formatFilter || undefined,
      source: sourceFilter || undefined,
      page: pageParam,
      limit: 40,
    }).then(r => r.data),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    enabled: viewMode === 'tile',
  });

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode !== 'tile' || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [viewMode, hasNextPage, fetchNextPage]);

  const tileItems = infiniteData?.pages?.flatMap(p => p.data || []) || [];
  const tileLoading = infiniteLoading;

  const stats = productsData?.stats;

  function generateGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 60%, 35%), hsl(${h2}, 50%, 25%))`;
  }

  function getReleaseInfo(dateStr?: string): { text: string; style: string; isCountdown: boolean; isUrgent: boolean } {
    if (!dateStr) return { text: '', style: 'bg-black/50', isCountdown: false, isUrgent: false };
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // KST date string for display
    const kstDate = new Date(date.getTime() + 9 * 3600000);
    const kstStr = `${kstDate.getUTCMonth() + 1}/${kstDate.getUTCDate()} KST`;

    if (diffDays > 7) return { text: `${kstStr}`, style: 'bg-black/50', isCountdown: false, isUrgent: false };
    if (diffDays > 1) return { text: `D-${diffDays} (${kstStr})`, style: 'bg-amber-500/90', isCountdown: true, isUrgent: false };
    if (diffDays === 1) return { text: t('catalog.releaseTomorrow'), style: 'bg-red-500 animate-pulse', isCountdown: true, isUrgent: true };
    if (diffDays === 0) return { text: t('catalog.releaseToday'), style: 'bg-green-500', isCountdown: true, isUrgent: false };
    if (diffDays >= -7) return { text: `${Math.abs(diffDays)}${t('catalog.releasedDaysAgo')}`, style: 'bg-zinc-600/80', isCountdown: false, isUrgent: false };
    return { text: kstStr, style: 'bg-zinc-600/60', isCountdown: false, isUrgent: false };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('catalog.title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('catalog.subtitle')}
          </p>
        </div>
        <button
          onClick={handlePullFromFuga}
          disabled={isPulling}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors"
        >
          {isPulling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          FUGA 싱크
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <span className="font-semibold text-zinc-900 dark:text-white">{t('catalog.total')} {stats.total}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-blue-600 dark:text-blue-400">{t('catalog.synced')} {stats.both}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-green-600 dark:text-green-400">{t('catalog.catalogOnly')} {stats.catalogOnly}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-orange-600 dark:text-orange-400">{t('catalog.submissionOnly')} {stats.submissionOnly}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={t('catalog.search')}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t('catalog.allStates')}</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PENDING">Pending</option>
          <option value="TAKEDOWN">Takedown</option>
        </select>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={formatFilter}
          onChange={e => { setFormatFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t('catalog.allFormats')}</option>
          <option value="SINGLE">Single</option>
          <option value="EP">EP</option>
          <option value="ALBUM">Album</option>
        </select>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
        >
          <option value="">{t('catalog.allSources')}</option>
          <option value="both">{t('catalog.synced')}</option>
          <option value="catalog">{t('catalog.catalogOnly')}</option>
          <option value="submission">{t('catalog.submissionOnly')}</option>
        </select>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
          <button
            className={`rounded-md p-1.5 ${viewMode === 'table' ? 'bg-zinc-200 dark:bg-zinc-600' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
            onClick={() => setViewMode('table')}
            title="테이블 뷰"
          >
            <List className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </button>
          <button
            className={`rounded-md p-1.5 ${viewMode === 'tile' ? 'bg-zinc-200 dark:bg-zinc-600' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
            onClick={() => setViewMode('tile')}
            title="타일 뷰"
          >
            <LayoutGrid className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Products Table / Tile View */}
      {viewMode === 'tile' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tileLoading ? (
            <p className="col-span-full text-center text-zinc-400 py-8">{t('catalog.loading')}</p>
          ) : tileItems.length === 0 ? (
            <p className="col-span-full text-center text-zinc-400 py-8">{t('catalog.noResults')}</p>
          ) : (
            tileItems.map((item: any) => (
              <div
                key={item.catalogProductId || item.submissionId}
                className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onClick={() => {
                  if (item.catalogProductId) {
                    navigate(`/admin/catalog/${item.catalogProductId}`);
                  } else if (item.submissionId) {
                    navigate(`/admin/catalog/${item.submissionId}?type=submission`);
                  }
                }}
              >
                {/* Cover Art Area */}
                <div className="relative aspect-square overflow-hidden">
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: generateGradient(item.name) }} />
                  )}
                  {/* Overlay text (only when no cover image) */}
                  {!item.coverImageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-lg font-bold text-white drop-shadow-lg">{item.name}</p>
                      {item.releaseVersion && (
                        <p className="mt-1 text-sm text-white/80 drop-shadow">{item.releaseVersion}</p>
                      )}
                      <p className="mt-2 text-sm text-white/70 drop-shadow">{item.displayArtist}</p>
                    </div>
                  )}
                  {/* Overlay: countdown top-left, format bottom-left */}
                  {(() => {
                    const ri = getReleaseInfo(item.consumerReleaseDate || item.releaseDate);
                    return ri.text ? (
                      <span className={`absolute top-2 left-2 rounded-md px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm ${ri.style}`}>
                        {ri.text}
                      </span>
                    ) : null;
                  })()}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {item.albumType || 'SINGLE'}
                  </span>
                </div>
                {/* Info below image */}
                <div className="p-3">
                  <p className="truncate font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.displayArtist}{item.label ? ` / ${item.label}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {item.state && <StateTag state={item.state} />}
                    <SubmissionStatusBadge status={item.submissionStatus} />
                    <SourceBadge source={item.source} />
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="col-span-full py-4 text-center">
            {isFetchingNextPage && <p className="text-zinc-400 animate-pulse">{t('catalog.loading')}</p>}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">앨범</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">아티스트</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">UPC</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">포맷</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">상태</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">제출 상태</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">트랙</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">소스</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">{t('catalog.loading')}</td></tr>
              ) : productsData?.data?.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">{t('catalog.noResults')}</td></tr>
              ) : (
                productsData?.data?.map((item: any) => (
                  <tr
                    key={item.catalogProductId || item.submissionId}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() => {
                  if (item.catalogProductId) {
                    navigate(`/admin/catalog/${item.catalogProductId}`);
                  } else if (item.submissionId) {
                    navigate(`/admin/catalog/${item.submissionId}?type=submission`);
                  }
                }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.coverImageUrl && (
                          <img src={item.coverImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white">{item.name}</div>
                          {item.releaseVersion && (
                            <div className="text-xs text-zinc-400">{item.releaseVersion}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{item.displayArtist}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.upc}</td>
                    <td className="px-4 py-3"><FormatTag format={item.albumType} /></td>
                    <td className="px-4 py-3">{item.state && <StateTag state={item.state} />}</td>
                    <td className="px-4 py-3"><SubmissionStatusBadge status={item.submissionStatus} /></td>
                    <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">{item.trackCount || '-'}</td>
                    <td className="px-4 py-3 text-center"><SourceBadge source={item.source} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — table view only */}
      {viewMode === 'table' && productsData && productsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            총 {productsData.total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, productsData.total)}
          </p>
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
              disabled={page >= productsData.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
