import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Users, Disc3, Building2, Link2, Unlink, LayoutGrid, List } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import type { CatalogProduct } from '../types/catalog';

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
      <Icon className="h-5 w-5 text-zinc-400" />
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

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

export default function CatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('table');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['catalog-stats'],
    queryFn: () => catalogApi.getStats().then(r => r.data),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog-products', search, stateFilter, labelFilter, formatFilter, page],
    queryFn: () => catalogApi.getProducts({
      search: search || undefined,
      state: stateFilter || undefined,
      label: labelFilter || undefined,
      format: formatFilter || undefined,
      page,
      limit: 20,
    }).then(r => r.data),
  });

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
          FUGA 카탈로그 메타데이터 — 마지막 동기화: {stats?.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString('ko-KR') : '-'}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Disc3} label="프로덕트" value={stats.products} />
          <StatCard icon={Music} label="트랙" value={stats.assets} />
          <StatCard icon={Users} label="아티스트" value={stats.artists} />
          <StatCard icon={Building2} label="레이블" value={stats.labels} />
          <StatCard icon={Link2} label="연결됨" value={stats.linked} />
          <StatCard icon={Unlink} label="미연결" value={stats.unlinked} />
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
            productsData?.data?.map((product: CatalogProduct) => (
              <div
                key={product.id}
                className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onClick={() => navigate(`/catalog/${product.id}`)}
              >
                {/* Cover Art Area */}
                <div className="relative aspect-square overflow-hidden" style={{ background: generateGradient(product.name) }}>
                  {/* Product name overlay on the gradient */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-lg font-bold text-white drop-shadow-lg">{product.name}</p>
                    {product.releaseVersion && (
                      <p className="mt-1 text-sm text-white/80 drop-shadow">{product.releaseVersion}</p>
                    )}
                    <p className="mt-2 text-sm text-white/70 drop-shadow">{product.displayArtist}</p>
                  </div>
                  {/* Bottom overlay badges */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-2">
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {getRelativeDate(product.consumerReleaseDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {product.label && (
                        <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                          {product.label}
                        </span>
                      )}
                      <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {product.releaseFormatType || 'SINGLE'}
                      </span>
                      {product.state === 'DELIVERED' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Info below image */}
                <div className="p-3">
                  <p className="truncate font-semibold text-zinc-900 dark:text-white">{product.name}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {product.displayArtist}{product.label ? ` / ${product.label}` : ''}
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs text-zinc-400">
                    <p>BARCODE  {product.upc}</p>
                    <p>CAT.NR.  {product.catalogNumber || product.upc}</p>
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
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">트랙</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">연결</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">불러오는 중...</td></tr>
              ) : productsData?.data?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">결과 없음</td></tr>
              ) : (
                productsData?.data?.map((product: CatalogProduct) => (
                  <tr
                    key={product.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() => navigate(`/catalog/${product.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-white">{product.name}</div>
                      {product.releaseVersion && (
                        <div className="text-xs text-zinc-400">{product.releaseVersion}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{product.displayArtist}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{product.upc}</td>
                    <td className="px-4 py-3"><FormatTag format={product.releaseFormatType} /></td>
                    <td className="px-4 py-3"><StateTag state={product.state} /></td>
                    <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">{product._count?.assets || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {product.submissionId ? (
                        <span className="text-green-500" title="Submission 연결됨">&#x2713;</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600" title="미연결">&#x2717;</span>
                      )}
                    </td>
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
