import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ExternalLink, Edit2, Trash2, X, Plus } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import type { CatalogArtist } from '../types/catalog';
import toast from 'react-hot-toast';

// Tag input component for array fields
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-zinc-400 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          className="flex-1 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700">
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Edit modal
function EditArtistModal({ artist, onClose, onSaved }: { artist: CatalogArtist; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: artist.name || '',
    type: artist.type || 'ARTIST',
    biography: artist.biography || '',
    countryOfOrigin: artist.countryOfOrigin || '',
    roles: artist.roles || [],
    genres: artist.genres || [],
    subgenres: artist.subgenres || [],
    labels: artist.labels || [],
    spotifyUrl: artist.spotifyUrl || '',
    spotifyId: artist.spotifyId || '',
    appleMusicUrl: artist.appleMusicUrl || '',
    appleMusicId: artist.appleMusicId || '',
    isni: artist.isni || '',
    ipi: artist.ipi || '',
    ipn: artist.ipn || '',
    youtubeOac: artist.youtubeOac || '',
    contactDetails: artist.contactDetails || '',
    bookingAgent: artist.bookingAgent || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await catalogApi.updateArtist(artist.id, form);
      toast.success('아티스트가 수정되었습니다');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, type = 'text' }: { label: string; field: string; type?: string }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          rows={3}
          value={(form as any)[field] || ''}
          onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={(form as any)[field] || ''}
          onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold dark:text-white">아티스트 편집</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="이름" field="name" />
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">타입</label>
            <select
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="ARTIST">Artist</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
          </div>
          <Field label="국가" field="countryOfOrigin" />
          <Field label="연락처" field="contactDetails" />
          <Field label="부킹 에이전트" field="bookingAgent" />
          <Field label="Spotify URL" field="spotifyUrl" />
          <Field label="Spotify ID" field="spotifyId" />
          <Field label="Apple Music URL" field="appleMusicUrl" />
          <Field label="Apple Music ID" field="appleMusicId" />
          <Field label="ISNI" field="isni" />
          <Field label="IPI" field="ipi" />
          <Field label="IPN" field="ipn" />
          <Field label="YouTube OAC" field="youtubeOac" />
        </div>

        <div className="mt-3">
          <Field label="바이오그래피" field="biography" type="textarea" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">역할</label>
            <TagInput value={form.roles} onChange={roles => setForm(prev => ({ ...prev, roles }))} placeholder="역할 추가..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">장르</label>
            <TagInput value={form.genres} onChange={genres => setForm(prev => ({ ...prev, genres }))} placeholder="장르 추가..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">서브장르</label>
            <TagInput value={form.subgenres} onChange={subgenres => setForm(prev => ({ ...prev, subgenres }))} placeholder="서브장르 추가..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">레이블</label>
            <TagInput value={form.labels} onChange={labels => setForm(prev => ({ ...prev, labels }))} placeholder="레이블 추가..." />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700 dark:text-white">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogArtistsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingArtist, setEditingArtist] = useState<CatalogArtist | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-artists', search, typeFilter, page],
    queryFn: () => catalogApi.getArtists({
      search: search || undefined,
      type: typeFilter || undefined,
      page,
      limit: 30,
    }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteArtist(id),
    onSuccess: () => {
      toast.success('아티스트가 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['catalog-artists'] });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '삭제 실패');
    },
  });

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['catalog-artists'] });
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex gap-2 text-xs">
        <span className="text-zinc-400 shrink-0">{label}:</span>
        <span className="text-zinc-700 dark:text-zinc-300 truncate">{value}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">아티스트 & 기여자</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">FUGA 카탈로그 아티스트 / 기여자 관리</p>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">{artist.name}</p>
                  <span className={`text-xs ${artist.type === 'ARTIST' ? 'text-blue-500' : 'text-zinc-400'}`}>
                    {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingArtist(artist)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-700"
                    title="편집"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(artist.id)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-700"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Roles */}
              {artist.roles?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.roles.map(role => (
                    <span key={role} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {role}
                    </span>
                  ))}
                </div>
              )}

              {/* Genres */}
              {(artist.genres?.length > 0 || artist.subgenres?.length > 0) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {artist.genres?.map(g => (
                    <span key={g} className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      {g}
                    </span>
                  ))}
                  {artist.subgenres?.map(g => (
                    <span key={g} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="mt-2 space-y-0.5">
                <InfoRow label="국가" value={artist.countryOfOrigin} />
                <InfoRow label="바이오" value={artist.biography ? (artist.biography.length > 60 ? artist.biography.slice(0, 60) + '...' : artist.biography) : undefined} />
                <InfoRow label="ISNI" value={artist.isni} />
                <InfoRow label="IPI" value={artist.ipi} />
                <InfoRow label="연락처" value={artist.contactDetails} />
              </div>

              {/* DSP Links */}
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

      {/* Edit Modal */}
      {editingArtist && (
        <EditArtistModal
          artist={editingArtist}
          onClose={() => setEditingArtist(null)}
          onSaved={handleInvalidate}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingId(null)}>
          <div className="rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-white">아티스트 삭제</h3>
            <p className="mt-2 text-sm text-zinc-500">정말 이 아티스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700 dark:text-white"
              >
                취소
              </button>
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
