import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import type { CatalogArtist } from '../types/catalog';

export default function CatalogArtistsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-artists', search, typeFilter, page],
    queryFn: () => catalogApi.getArtists({
      search: search || undefined,
      type: typeFilter || undefined,
      page,
      limit: 30,
    }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">아티스트 & 기여자</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">FUGA 카탈로그 아티스트 / 기여자 목록</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="이름 검색..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">전체</option>
          <option value="ARTIST">아티스트</option>
          <option value="CONTRIBUTOR">기여자</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full text-center text-zinc-400 py-8">불러오는 중...</p>
        ) : data?.data?.length === 0 ? (
          <p className="col-span-full text-center text-zinc-400 py-8">결과 없음</p>
        ) : (
          data?.data?.map((artist: CatalogArtist) => (
            <div
              key={artist.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{artist.name}</p>
                  <span className={`text-xs ${artist.type === 'ARTIST' ? 'text-blue-500' : 'text-zinc-400'}`}>
                    {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                  </span>
                </div>
              </div>
              {artist.roles?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.roles.map(role => (
                    <span key={role} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {role}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {artist.spotifyUrl && (
                  <a
                    href={artist.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                  >
                    Spotify <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {artist.appleMusicUrl && (
                  <a
                    href={artist.appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs text-pink-700 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400"
                  >
                    Apple Music <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
  );
}
