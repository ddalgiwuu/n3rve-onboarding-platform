import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Save, Users, Globe, Music, X, Trash2, ExternalLink, Plus } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import toast from 'react-hot-toast';

function TagEditor({ value, onChange, disabled, placeholder }: { value: string[]; onChange: (v: string[]) => void; disabled: boolean; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };
  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.length > 0 ? value.map((tag, i) => (
          <span key={i} className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs text-purple-700 dark:text-purple-300">{tag}</span>
        )) : <span className="text-gray-400">-</span>}
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-purple-400 hover:text-red-500"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="px-2 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function CatalogArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    catalogApi.getArtist(id)
      .then(res => {
        setArtist(res.data);
        setFormData(res.data);
      })
      .catch(() => toast.error('아티스트를 찾을 수 없습니다'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!artist) return;
    try {
      const res = await catalogApi.updateArtist(artist.id, {
        name: formData.name,
        type: formData.type,
        biography: formData.biography,
        countryOfOrigin: formData.countryOfOrigin,
        roles: formData.roles,
        genres: formData.genres,
        subgenres: formData.subgenres,
        labels: formData.labels,
        spotifyUrl: formData.spotifyUrl,
        spotifyId: formData.spotifyId,
        appleMusicUrl: formData.appleMusicUrl,
        appleMusicId: formData.appleMusicId,
        isni: formData.isni,
        ipi: formData.ipi,
        ipn: formData.ipn,
        youtubeOac: formData.youtubeOac,
        contactDetails: formData.contactDetails,
        bookingAgent: formData.bookingAgent,
      });
      setArtist(res.data);
      setFormData(res.data);
      setIsEditing(false);
      toast.success('아티스트 정보가 업데이트되었습니다');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '업데이트 실패');
    }
  };

  const handleDelete = async () => {
    if (!artist || !confirm('정말 이 아티스트를 삭제하시겠습니까?')) return;
    try {
      await catalogApi.deleteArtist(artist.id);
      toast.success('아티스트가 삭제되었습니다');
      navigate('/admin/catalog/artists');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '삭제 실패');
    }
  };

  const handleCancel = () => {
    setFormData(artist || {});
    setIsEditing(false);
  };

  const val = (field: string) => isEditing ? (formData[field] || '') : (artist?.[field] || '');
  const set = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">아티스트를 찾을 수 없습니다</h2>
          <button onClick={() => navigate('/admin/catalog/artists')} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/admin/catalog/artists')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            카탈로그 아티스트로 돌아가기
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-5xl font-bold text-white">{artist.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{artist.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    artist.type === 'ARTIST'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                  </span>
                  {artist.countryOfOrigin && <span className="text-sm">{artist.countryOfOrigin}</span>}
                  <span className="text-sm">N3RVE ID: {artist.fugaId}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    <Edit size={18} /> 편집
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    <Trash2 size={18} /> 삭제
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    <Save size={18} /> 저장
                  </button>
                  <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    <X size={18} /> 취소
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" /> 기본 정보
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                  <input type="text" value={val('name')} onChange={e => set('name', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">타입</label>
                  {isEditing ? (
                    <select value={val('type')} onChange={e => set('type', e.target.value)} className={inputCls}>
                      <option value="ARTIST">Artist</option>
                      <option value="CONTRIBUTOR">Contributor</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                      {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Globe className="inline w-4 h-4 mr-1" /> 국가
                  </label>
                  <input type="text" value={val('countryOfOrigin')} onChange={e => set('countryOfOrigin', e.target.value)} disabled={!isEditing} placeholder="예: KR" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">연락처</label>
                  <input type="text" value={val('contactDetails')} onChange={e => set('contactDetails', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">부킹 에이전트</label>
                  <input type="text" value={val('bookingAgent')} onChange={e => set('bookingAgent', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">생성일</label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    {new Date(artist.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">바이오그래피</label>
                <textarea
                  value={val('biography')}
                  onChange={e => set('biography', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className={inputCls}
                  placeholder="아티스트에 대한 설명을 입력하세요"
                />
              </div>

              {/* Tags */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">역할</label>
                  <TagEditor value={formData.roles || []} onChange={v => set('roles', v)} disabled={!isEditing} placeholder="역할 추가..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">장르</label>
                  <TagEditor value={formData.genres || []} onChange={v => set('genres', v)} disabled={!isEditing} placeholder="장르 추가..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">서브장르</label>
                  <TagEditor value={formData.subgenres || []} onChange={v => set('subgenres', v)} disabled={!isEditing} placeholder="서브장르 추가..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">레이블</label>
                  <TagEditor value={formData.labels || []} onChange={v => set('labels', v)} disabled={!isEditing} placeholder="레이블 추가..." />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - DSP & Identifiers */}
          <div className="space-y-6">
            {/* DSP Profiles */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-green-500" /> DSP 프로필
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Spotify URL</label>
                  {isEditing ? (
                    <input type="text" value={val('spotifyUrl')} onChange={e => set('spotifyUrl', e.target.value)} className={inputCls} />
                  ) : artist.spotifyUrl ? (
                    <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline text-sm">
                      <ExternalLink className="h-3 w-3" /> {artist.spotifyUrl}
                    </a>
                  ) : <span className="text-gray-400 text-sm">-</span>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Spotify ID</label>
                  <input type="text" value={val('spotifyId')} onChange={e => set('spotifyId', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apple Music URL</label>
                  {isEditing ? (
                    <input type="text" value={val('appleMusicUrl')} onChange={e => set('appleMusicUrl', e.target.value)} className={inputCls} />
                  ) : artist.appleMusicUrl ? (
                    <a href={artist.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline text-sm">
                      <ExternalLink className="h-3 w-3" /> {artist.appleMusicUrl}
                    </a>
                  ) : <span className="text-gray-400 text-sm">-</span>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apple Music ID</label>
                  <input type="text" value={val('appleMusicId')} onChange={e => set('appleMusicId', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">YouTube OAC</label>
                  <input type="text" value={val('youtubeOac')} onChange={e => set('youtubeOac', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
              </div>
            </motion.div>

            {/* International Identifiers */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" /> 국제 식별자
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ISNI</label>
                  <input type="text" value={val('isni')} onChange={e => set('isni', e.target.value)} disabled={!isEditing} className={inputCls} placeholder="0000 0000 0000 0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IPI</label>
                  <input type="text" value={val('ipi')} onChange={e => set('ipi', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IPN</label>
                  <input type="text" value={val('ipn')} onChange={e => set('ipn', e.target.value)} disabled={!isEditing} className={inputCls} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
