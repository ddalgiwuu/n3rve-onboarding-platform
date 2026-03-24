import { useState } from 'react';
import { Eye, Trash2, Music, CheckCircle, XCircle, Clock } from 'lucide-react';
import { dropboxService } from '@/services/dropbox.service';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';

interface Props {
  submissions: any[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  readOnly?: boolean;
}

function getCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return dropboxService.getDirectUrl(url);
  } catch {
    return url;
  }
}

function getReleaseBadge(releaseDate: string | Date | undefined): string {
  if (!releaseDate) return '';
  const daysUntilRelease = Math.ceil(
    (new Date(releaseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilRelease > 0) return `in ${daysUntilRelease}d`;
  if (daysUntilRelease === 0) return 'Today';
  return `${Math.abs(daysUntilRelease)}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-400" />;
}

function AlbumTypeBadge({ type }: { type: string }) {
  const normalized = (type || '').toUpperCase();
  const colorMap: Record<string, string> = {
    SINGLE: 'bg-blue-600/80',
    EP: 'bg-purple-600/80',
    ALBUM: 'bg-indigo-600/80',
  };
  const color = colorMap[normalized] || 'bg-gray-600/80';
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
      {normalized || 'ALBUM'}
    </span>
  );
}

function SubmissionCard({
  submission,
  onDelete,
  onView,
  readOnly,
  t,
}: {
  submission: any;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  readOnly?: boolean;
  t: (ko: string, en: string, ja?: string) => string;
}) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = getCoverUrl(submission.files?.coverImageUrl);
  const showImage = coverUrl && !imgError;
  const releaseBadge = getReleaseBadge(submission.releaseDate);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 cursor-pointer">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {showImage ? (
          <img
            src={coverUrl}
            alt={submission.albumTitle || 'Cover'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 dark:from-purple-900/40 dark:via-indigo-900/40 dark:to-blue-900/40">
            <Music className="w-16 h-16 text-purple-300 dark:text-purple-500" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute inset-x-0 bottom-0 p-2 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent">
          {/* Bottom-left: days until release */}
          <span className="text-white text-xs font-semibold bg-black/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
            {releaseBadge}
          </span>

          {/* Bottom-center: label name */}
          {submission.labelName && (
            <span className="text-white/80 text-xs truncate max-w-[30%] text-center">
              {submission.labelName}
            </span>
          )}

          {/* Bottom-right: album type + status */}
          <div className="flex items-center gap-1">
            <AlbumTypeBadge type={submission.albumType} />
            <StatusIcon status={submission.status} />
          </div>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate leading-tight">
          {submission.albumTitle || '-'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {submission.artistName}
          {submission.labelName ? ` / ${submission.labelName}` : ''}
        </p>
        {/* Label account badge */}
        <div className="mt-1.5">
          {submission.labelAccount ? (
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 truncate max-w-full">
              {submission.labelAccount.company || submission.labelAccount.name}
            </span>
          ) : (
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {t('미매핑', 'Unmapped')}
            </span>
          )}
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <span className="font-medium text-gray-500 dark:text-gray-400">BARCODE</span>{' '}
            {submission.release?.upc || '-'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <span className="font-medium text-gray-500 dark:text-gray-400">CAT. NR.</span>{' '}
            {submission.release?.catalogNumber || '-'}
          </p>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(submission.id);
          }}
          className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-900 text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
          aria-label={t('상세보기', 'View detail')}
        >
          <Eye className="w-4 h-4" />
          {t('상세보기', 'View')}
        </button>
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(submission.id);
            }}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
            aria-label={t('삭제', 'Delete')}
          >
            <Trash2 className="w-4 h-4" />
            {t('삭제', 'Delete')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SubmissionTileView({ submissions, onDelete, onView, readOnly }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        {t('제출물이 없습니다', 'No submissions found', '提出物がありません')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          onDelete={onDelete}
          onView={onView}
          readOnly={readOnly}
          t={t}
        />
      ))}
    </div>
  );
}
