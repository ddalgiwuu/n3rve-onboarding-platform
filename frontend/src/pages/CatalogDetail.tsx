import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, Clock, ChevronDown, ChevronRight,
  ExternalLink, Disc3, Users, FileText, Globe, MessageSquare, Image,
} from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import { formatDuration } from '../utils/format';
import type { CatalogAsset, CatalogContributor } from '../types/catalog';

function DspLink({ url, type }: { url?: string | null; type: 'spotify' | 'apple' }) {
  if (!url) return null;
  const label = type === 'spotify' ? 'Spotify' : 'Apple Music';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function ContributorsByRole({ contributors }: { contributors: CatalogContributor[] }) {
  const grouped: Record<string, CatalogContributor[]> = {};
  for (const c of contributors) {
    if (!grouped[c.role]) grouped[c.role] = [];
    if (!grouped[c.role].find(x => x.personId === c.personId)) {
      grouped[c.role].push(c);
    }
  }

  return (
    <div className="space-y-2 pl-4">
      {Object.entries(grouped).map(([role, people]) => (
        <div key={role}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{role}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {people.map(c => (
              <span key={c.personId} className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {c.name}
                <DspLink url={c.spotifyUrl} type="spotify" />
                <DspLink url={c.appleMusicUrl} type="apple" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackRow({ asset, index }: { asset: CatalogAsset; index: number }) {
  const [showContributors, setShowContributors] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const title = asset.version ? `${asset.name} (${asset.version})` : asset.name;

  return (
    <div className="border-b border-zinc-100 last:border-0 dark:border-zinc-700">
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-6 text-center text-sm text-zinc-400">{asset.sequence || index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 dark:text-white truncate">{title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {asset.isrc && <span className="font-mono">ISRC: {asset.isrc}</span>}
            {asset.assetCatalogTier && <span>Tier: {asset.assetCatalogTier}</span>}
            {asset.versionTypes?.length > 0 && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                {asset.versionTypes.map(v => v.name).join(', ')}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(asset.duration)}
        </span>
      </div>

      <div className="flex gap-2 px-4 pb-2">
        {asset.contributors?.length > 0 && (
          <button
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => setShowContributors(!showContributors)}
          >
            {showContributors ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Users className="h-3 w-3" />
            기여자 ({asset.contributors.length})
          </button>
        )}
        {asset.hasLyrics && asset.lyrics && (
          <button
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => setShowLyrics(!showLyrics)}
          >
            {showLyrics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <FileText className="h-3 w-3" />
            가사
          </button>
        )}
      </div>

      {showContributors && asset.contributors && (
        <div className="px-4 pb-3">
          <ContributorsByRole contributors={asset.contributors} />
        </div>
      )}

      {showLyrics && asset.lyrics && (
        <div className="px-4 pb-3">
          <pre className="max-h-60 overflow-auto rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap dark:bg-zinc-800 dark:text-zinc-300">
            {asset.lyrics}
          </pre>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className="text-zinc-700 dark:text-zinc-300">{value}</p>
    </div>
  );
}

export default function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ['catalog-product', id],
    queryFn: () => catalogApi.getProduct(id!).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">불러오는 중...</div>;
  }

  if (!product) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">프로덕트를 찾을 수 없습니다</div>;
  }

  const submission = (product as any).submission;
  const coverImageUrl = submission?.files?.coverImageUrl || (product as any).coverImageUrl;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        onClick={() => navigate('/catalog')}
      >
        <ArrowLeft className="h-4 w-4" /> 카탈로그로 돌아가기
      </button>

      {/* Product header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-start gap-6">
          {/* Cover Art */}
          {coverImageUrl && (
            <div className="flex-shrink-0">
              <img
                src={coverImageUrl}
                alt={product.name}
                className="h-40 w-40 rounded-lg object-cover shadow-md"
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{product.name}</h1>
                  {product.releaseVersion && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {product.releaseVersion}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    product.state === 'DELIVERED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {product.state}
                  </span>
                  {submission && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      submission.status === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      Submission: {submission.status?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">{product.displayArtist}</p>
              </div>
              <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                {product.releaseFormatType && <p>{product.releaseFormatType}</p>}
                {product.label && <p>{product.label}</p>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-zinc-400">UPC</p>
                <p className="font-mono text-zinc-700 dark:text-zinc-300">{product.upc}</p>
              </div>
              <div>
                <p className="text-zinc-400">발매일</p>
                <p className="text-zinc-700 dark:text-zinc-300">{product.consumerReleaseDate?.split('T')[0] || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400">장르</p>
                <p className="text-zinc-700 dark:text-zinc-300">{product.genre?.name || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400">언어</p>
                <p className="text-zinc-700 dark:text-zinc-300">{product.language || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400">&copy; Line</p>
                <p className="text-zinc-700 dark:text-zinc-300">{product.cLineText || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400">&#x2117; Line</p>
                <p className="text-zinc-700 dark:text-zinc-300">{product.pLineText || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400">Submission</p>
                {submission ? (
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                  >
                    {submission.albumTitle || submission.id} ({submission.status})
                  </button>
                ) : (
                  <span className="text-zinc-400">미연결</span>
                )}
              </div>
              <div>
                <p className="text-zinc-400">동기화</p>
                <p className="text-zinc-700 dark:text-zinc-300">{new Date(product.syncedAt).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artists with DSP links */}
        {product.artists?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">아티스트</p>
            <div className="flex flex-wrap gap-3">
              {product.artists.map((artist, i) => (
                <div key={i} className="inline-flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{artist.name}</span>
                  {artist.primary && <span className="text-xs text-zinc-400">(Primary)</span>}
                  <DspLink url={artist.spotifyUrl} type="spotify" />
                  <DspLink url={artist.appleMusicUrl} type="apple" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submission Extended Info */}
      {submission && (
        <>
          {/* Marketing / Description */}
          {(submission.albumDescription || submission.biography || submission.marketing) && (
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">마케팅 / 설명</h2>
              </div>
              <div className="space-y-4 p-4">
                {submission.albumDescription && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">앨범 설명</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{submission.albumDescription}</p>
                  </div>
                )}
                {submission.biography && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">바이오그래피</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{submission.biography}</p>
                  </div>
                )}
                {submission.marketing && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">마케팅 정보</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {typeof submission.marketing === 'string' ? submission.marketing : JSON.stringify(submission.marketing, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {submission.socialLinks && Object.keys(submission.socialLinks).length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <Globe className="h-4 w-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">소셜 링크</h2>
              </div>
              <div className="flex flex-wrap gap-3 p-4">
                {Object.entries(submission.socialLinks).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    >
                      {platform} <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Submission Info */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <FileText className="h-4 w-4 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-white">제출 정보</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-4">
              <InfoField label="제출자" value={submission.submitterName || submission.userId} />
              <InfoField label="제출 상태" value={submission.status?.toUpperCase()} />
              <InfoField label="제출일" value={submission.createdAt ? new Date(submission.createdAt).toLocaleDateString('ko-KR') : undefined} />
              <InfoField label="관리자 노트" value={submission.adminNotes} />
              <InfoField label="아티스트명" value={submission.artistName} />
              <InfoField label="레이블" value={submission.labelName} />
              <InfoField label="앨범 타입" value={submission.albumType} />
              <InfoField label="발매 희망일" value={submission.releaseDate} />
            </div>
          </div>
        </>
      )}

      {/* Tracks */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Music className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            트랙 ({product.assets?.length || 0})
          </h2>
        </div>
        {product.assets?.map((asset, i) => (
          <TrackRow key={asset.id} asset={asset} index={i} />
        ))}
      </div>
    </div>
  );
}
