import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Users, Disc3, Building2, Link2, Unlink, LayoutGrid, List } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';

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
  if (source === 'catalog') return <span className="rounded-full bg-green-500/80 px-2 py-0.5 text-xs text-white">FUGA</span>;
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
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('table');
  const [page, setPage] = useState(1);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog-unified', search, stateFilter, formatFilter, sourceFilter, page],
    queryFn: () => catalogApi.getUnifiedProducts({
      search: search || undefined,
      state: stateFilter || undefined,
      format: formatFilter || undefined,
      source: sourceFilter || undefined,
      page,
      limit: 20,
    }).then(r => r.data),
  });

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

  function getRelativeDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'yesterday';
    if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    if (diffDays > 7 && diffDays <= 90) return 'next quarter';
    if (diffDays < -7 && diffDays >= -30) return 'last week';
    if (diffDays < -30 && diffDays >= -90) return 'last month';
    if (diffDays < -90) return 'older';
    return 'upcoming';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Catalog</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          FUGA 카탈로그 + Submission 통합 뷰
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <span className="font-semibold text-zinc-900 dark:text-white">총 {stats.total}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-blue-600 dark:text-blue-400">양쪽 동기화 {stats.both}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-green-600 dark:text-green-400">FUGA만 {stats.catalogOnly}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-orange-600 dark:text-orange-400">제출만 {stats.submissionOnly}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="검색 (앨범명, UPC, 아티스트)..."
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
          <option value="">모든 상태</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PENDING">Pending</option>
          <option value="TAKEDOWN">Takedown</option>
        </select>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={formatFilter}
          onChange={e => { setFormatFilter(e.target.value); setPage(1); }}
        >
          <option value="">모든 포맷</option>
          <option value="SINGLE">Single</option>
          <option value="EP">EP</option>
          <option value="ALBUM">Album</option>
        </select>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
        >
          <option value="">모든 소스</option>
          <option value="both">양쪽 동기화</option>
          <option value="catalog">FUGA만</option>
          <option value="submission">제출만</option>
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
          {isLoading ? (
            <p className="col-span-full text-center text-zinc-400 py-8">불러오는 중...</p>
          ) : productsData?.data?.length === 0 ? (
            <p className="col-span-full text-center text-zinc-400 py-8">결과 없음</p>
          ) : (
            productsData?.data?.map((item: any) => (
              <div
                key={item.catalogProductId || item.submissionId}
                className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onClick={() => navigate(item.catalogProductId ? `/catalog/${item.catalogProductId}` : `/admin/submissions/${item.submissionId}`)}
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
                  {/* Bottom overlay badges */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-2">
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {getRelativeDate(item.consumerReleaseDate || item.releaseDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.label && (
                        <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                          {item.label}
                        </span>
                      )}
                      <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {item.albumType || 'SINGLE'}
                      </span>
                      {item.state === 'DELIVERED' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                      <SourceBadge source={item.source} />
                    </div>
                  </div>
                </div>
                {/* Info below image */}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                    <SubmissionStatusBadge status={item.submissionStatus} />
                  </div>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {item.displayArtist}{item.label ? ` / ${item.label}` : ''}
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs text-zinc-400">
                    <p>BARCODE  {item.upc}</p>
                    <p>CAT.NR.  {item.catalogNumber || item.upc}</p>
                    {item.trackCount != null && <p>TRACKS  {item.trackCount}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">불러오는 중...</td></tr>
              ) : productsData?.data?.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">결과 없음</td></tr>
              ) : (
                productsData?.data?.map((item: any) => (
                  <tr
                    key={item.catalogProductId || item.submissionId}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() => navigate(item.catalogProductId ? `/catalog/${item.catalogProductId}` : `/admin/submissions/${item.submissionId}`)}
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

      {/* Pagination */}
      {productsData && productsData.totalPages > 1 && (
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
