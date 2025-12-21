import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Save,
  Users,
  MapPin,
  Home,
  Image as ImageIcon,
  Globe,
  Music,
  Calendar,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslationFixed';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SavedArtist {
  id: string;
  name: string;
  country?: string;
  currentCity?: string;
  hometown?: string;
  bio?: string;
  gender?: string;
  socialMovements?: string;
  syncHistory?: boolean;
  syncHistoryDetails?: string;
  artistAvatarUrl?: string;
  artistBannerUrl?: string;
  pressPhotosUrl?: string;
  pressPhotoCredits?: string;
  similarArtists?: string[];
  status: 'DRAFT' | 'COMPLETE' | 'VERIFIED';
  completionScore: number;
  releaseCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  dspProfiles?: Array<{ platform: string; url?: string; verified: boolean }>;
  socialProfiles?: Array<{ platform: string; url?: string; verified: boolean; followerCount?: number }>;
  translations?: Array<{ language: string; name: string }>;
}

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [artist, setArtist] = useState<SavedArtist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SavedArtist>>({});
  const [activeTab, setActiveTab] = useState<'dsp' | 'social'>('dsp');
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    email: '',
    labelName: '',
    platforms: [] as string[],
    comments: ''
  });

  const translate = (ko: string, en: string, ja: string) => {
    if (language === 'ko') return ko;
    if (language === 'ja') return ja;
    return en;
  };

  // Fetch artist data
  useEffect(() => {
    const fetchArtist = async () => {
      try {
        setIsLoading(true);
        // Fetch from API
        const response = await api.get(`/saved-artists/artists`);
        const allArtists = response.data;
        const foundArtist = allArtists.find((a: SavedArtist) => a.id === id);

        if (foundArtist) {
          setArtist(foundArtist);
          setFormData(foundArtist);
        } else {
          toast.error('아티스트를 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
        toast.error('아티스트 정보를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchArtist();
    }
  }, [id]);

  const handleSave = async () => {
    if (!artist) return;

    try {
      await api.put(`/saved-artists/artists/${artist.id}`, formData);
      setArtist({ ...artist, ...formData });
      setIsEditing(false);
      toast.success('아티스트 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating artist:', error);
      toast.error('업데이트 실패');
    }
  };

  const handleCancel = () => {
    setFormData(artist || {});
    setIsEditing(false);
  };

  const missingFields = [
    !artist?.country && 'Country',
    !artist?.currentCity && 'Current City',
    !artist?.hometown && 'Hometown',
    !artist?.artistAvatarUrl && 'Artist Image',
    !artist?.pressPhotosUrl && 'Press Shots',
  ].filter(Boolean);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Users size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            아티스트를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => navigate('/artist-roster')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/artist-roster')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            {translate('아티스트 로스터로 돌아가기', 'Back to Artist Roster', 'アーティストロスターに戻る')}
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                {artist.artistAvatarUrl ? (
                  <img
                    src={artist.artistAvatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                    <span className="text-4xl font-bold text-gray-700 dark:text-gray-300">
                      {artist.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{artist.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                    {artist.status}
                  </span>
                  <span className="text-sm">
                    {translate('사용 횟수', 'Usage Count', '使用回数')}: {artist.usageCount}
                  </span>
                  <span className="text-sm">
                    {translate('릴리스', 'Releases', 'リリース')}: {artist.releaseCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Edit size={18} />
                {translate('편집', 'Edit', '編集')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save size={18} />
                  {translate('저장', 'Save', '保存')}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                  {translate('취소', 'Cancel', 'キャンセル')}
                </button>
              </div>
            )}
          </div>

          {/* Missing Fields Warning */}
          {missingFields.length > 0 && (
            <div className="mt-4 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>{translate('누락된 필드', 'Missing fields', '不足フィールド')}:</strong>{' '}
                {missingFields.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {translate('기본 정보', 'Basic Information', '基本情報')}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Artist Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('아티스트 이름', 'Artist Name', 'アーティスト名')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? (formData.name || '') : artist.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {translate('생성일', 'Created', '作成日')}
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    {new Date(artist.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Globe className="inline w-4 h-4 mr-1" />
                    {translate('국가', 'Country', '国')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? (formData.country || '') : (artist.country || '-')}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditing}
                    placeholder={translate('예: 대한민국', 'e.g., South Korea', '例：韓国')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                {/* Current City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    {translate('현재 도시', 'Current City', '現在の都市')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? (formData.currentCity || '') : (artist.currentCity || '-')}
                    onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                    disabled={!isEditing}
                    placeholder={translate('예: 서울', 'e.g., Seoul', '例：ソウル')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                {/* Hometown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Home className="inline w-4 h-4 mr-1" />
                    {translate('고향', 'Hometown', '故郷')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? (formData.hometown || '') : (artist.hometown || '-')}
                    onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                    disabled={!isEditing}
                    placeholder={translate('예: 부산', 'e.g., Busan', '例：釜山')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                {/* Artist Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('성별', 'Artist Gender', '性別')}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{translate('선택', 'Select', '選択')}</option>
                      <option value="MALE">{translate('남성', 'Male', '男性')}</option>
                      <option value="FEMALE">{translate('여성', 'Female', '女性')}</option>
                      <option value="NON_BINARY">{translate('논바이너리', 'Non-Binary', 'ノンバイナリー')}</option>
                      <option value="GROUP">{translate('그룹', 'Group', 'グループ')}</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                      {artist.gender || '-'}
                    </div>
                  )}
                </div>

                {/* Sync History */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Music className="inline w-4 h-4 mr-1" />
                    {translate('싱크 히스토리', 'Artist Sync History Y/N', 'シンク履歴')}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.syncHistory ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, syncHistory: e.target.value === 'yes' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="no">{translate('아니오', 'No', 'いいえ')}</option>
                      <option value="yes">{translate('예', 'Yes', 'はい')}</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                      {artist.syncHistory ? translate('예', 'Yes', 'はい') : translate('아니오', 'No', 'いいえ')}
                    </div>
                  )}
                </div>

                {/* Press Photo Credits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('프레스샷 크레딧', 'Press Shot Credits', 'プレスショットクレジット')}
                  </label>
                  <input
                    type="text"
                    value={isEditing ? (formData.pressPhotoCredits || '') : (artist.pressPhotoCredits || '-')}
                    onChange={(e) => setFormData({ ...formData, pressPhotoCredits: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              {/* Artist Bio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate('아티스트 바이오', 'Artist Bio', 'アーティストバイオ')}
                </label>
                <textarea
                  value={isEditing ? (formData.bio || '') : (artist.bio || '-')}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder={translate('아티스트에 대한 설명을 입력하세요', 'Enter artist biography', 'アーティストの説明を入力')}
                />
              </div>

              {/* Social Movements */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate('사회 운동', 'Social Movements / Awareness Raising', '社会運動')}
                </label>
                <textarea
                  value={isEditing ? (formData.socialMovements || '') : (artist.socialMovements || '-')}
                  onChange={(e) => setFormData({ ...formData, socialMovements: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              {/* Sync History Details */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate('싱크 히스토리 상세', 'Artist Sync History Details', 'シンク履歴詳細')}
                </label>
                <textarea
                  value={isEditing ? (formData.syncHistoryDetails || '') : (artist.syncHistoryDetails || '-')}
                  onChange={(e) => setFormData({ ...formData, syncHistoryDetails: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              {/* Similar Artists */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate('유사 아티스트', 'Similar Artists (Sounds Like)', '類似アーティスト')}
                </label>
                <input
                  type="text"
                  value={isEditing ? (formData.similarArtists?.join(', ') || '') : (artist.similarArtists?.join(', ') || '-')}
                  onChange={(e) => setFormData({ ...formData, similarArtists: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  disabled={!isEditing}
                  placeholder={translate('쉼표로 구분', 'Comma separated', 'カンマ区切り')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>
            </motion.div>

            {/* DSP & Social Media Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('dsp')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'dsp'
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {translate('DSP 프로필', 'DSP Profile URLs & Verification', 'DSPプロフィール')}
                  </button>
                  <button
                    onClick={() => setActiveTab('social')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'social'
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {translate('소셜 미디어', 'Social Media URLs & Verification', 'ソーシャルメディア')}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'dsp' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {translate('DSP 프로필 URL', 'DSP Profile URLs', 'DSPプロフィールURL')}
                    </h3>
                    {['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Deezer'].map((platform) => {
                      const profile = artist.dspProfiles?.find(p => p.platform === platform);
                      return (
                        <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-gray-900 dark:text-white">{platform}</span>
                            {profile?.verified && (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <Check size={16} />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {profile?.url || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {translate('소셜 미디어 URL', 'Social Media URLs', 'ソーシャルメディアURL')}
                      </h3>
                      <div className="space-y-3">
                        {['Facebook', 'Instagram', 'Pinterest', 'SnapChat', 'TikTok', 'Triller', 'Tumblr', 'Twitch', 'X (fka Twitter)', 'YouTube', 'Threads', 'Official Artist Website'].map((platform) => {
                          const profile = artist.socialProfiles?.find(p => p.platform === platform);
                          return (
                            <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-pink-600" />
                                <span className="font-medium text-gray-900 dark:text-white">{platform}</span>
                                {profile?.verified && (
                                  <span className="flex items-center gap-1 text-green-600 text-sm">
                                    <Check size={16} />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {profile?.url || '-'}
                                {profile?.followerCount && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({profile.followerCount.toLocaleString()} followers)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Verification Request Section */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {translate('프로필 인증 요청', 'Profile Verification Requests', 'プロフィール認証リクエスト')}
                        </h3>
                        <button
                          onClick={() => setShowVerificationModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Check size={18} />
                          {translate('인증 요청', 'Request Verification', '認証をリクエスト')}
                        </button>
                      </div>

                      {/* Verification Requests Table */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              <th className="px-4 py-3">{translate('제출일', 'Date Submitted', '提出日')}</th>
                              <th className="px-4 py-3">Facebook</th>
                              <th className="px-4 py-3">Instagram</th>
                              <th className="px-4 py-3">TikTok</th>
                              <th className="px-4 py-3">SnapChat</th>
                              <th className="px-4 py-3">{translate('상태 업데이트', 'Status Updated', 'ステータス更新')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <Check size={32} className="text-gray-400" />
                                  </div>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {translate(
                                      '위 버튼을 클릭하여 소셜 미디어 계정 인증을 요청하세요',
                                      'Click the button above this table to Request Social Media Account Verification',
                                      '上のボタンをクリックしてソーシャルメディアアカウントの認証をリクエストしてください'
                                    )}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats & Media */}
          <div className="space-y-6">
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {translate('통계', 'Statistics', '統計')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{translate('완성도', 'Completion', '完了度')}</span>
                  <span className="text-2xl font-bold text-purple-600">{artist.completionScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{translate('릴리스 수', 'Releases', 'リリース数')}</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">{artist.releaseCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{translate('사용 횟수', 'Usage', '使用回数')}</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">{artist.usageCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Press Photos Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                {translate('프레스 샷', 'Press Shots / Artist Images', 'プレスショット')}
              </h3>
              {artist.pressPhotosUrl ? (
                <img
                  src={artist.pressPhotosUrl}
                  alt="Press Shot"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-400" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Verification Request Modal */}
      {showVerificationModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {translate('소셜 미디어 인증 요청', 'Social Media Verification Requests', 'ソーシャルメディア認証リクエスト')}
              </h2>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Artist Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{translate('아티스트', 'Artist', 'アーティスト')}:</strong> {artist?.name} | <strong>ID:</strong> {artist?.id}
                </p>
              </div>

              {/* Info Text */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {translate(
                    'TikTok, Instagram/Facebook (Meta), Snapchat의 인증을 요청할 수 있습니다. 아래 요구사항을 주의 깊게 읽어주세요.',
                    'We can help request verification on TikTok, Instagram/Facebook (Meta), and Snapchat. Please read the requirements below carefully.',
                    'TikTok、Instagram/Facebook（Meta）、Snapchatの認証をリクエストできます。以下の要件を注意深くお読みください。'
                  )}
                </p>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    {translate(
                      '모든 조건이 충족되어도 승인이 보장되지 않습니다. 거부 시 30일 후 재신청할 수 있습니다.',
                      'Even if all criteria are met, approval is not guaranteed. If declined, we may reapply after 30 days.',
                      'すべての条件を満たしても、承認は保証されません。却下された場合、30日後に再申請できます。'
                    )}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('이메일 주소', 'Your Email Address', 'メールアドレス')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={verificationForm.email}
                    onChange={(e) => setVerificationForm({ ...verificationForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Label Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('레이블 이름', 'Label Name', 'レーベル名')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={verificationForm.labelName}
                    onChange={(e) => setVerificationForm({ ...verificationForm, labelName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={translate('예: N3RVE Music', 'e.g., N3RVE Music', '例：N3RVE Music')}
                  />
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {translate('인증받고 싶은 플랫폼은?', 'What platform are you looking to be verified on?', 'どのプラットフォームで認証を受けたいですか？')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Facebook', 'Instagram', 'Snapchat', 'TikTok'].map((platform) => (
                      <label
                        key={platform}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={verificationForm.platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVerificationForm({
                                ...verificationForm,
                                platforms: [...verificationForm.platforms, platform]
                              });
                            } else {
                              setVerificationForm({
                                ...verificationForm,
                                platforms: verificationForm.platforms.filter(p => p !== platform)
                              });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate('추가 의견', 'Any Additional Comments?', '追加コメント')}
                  </label>
                  <textarea
                    value={verificationForm.comments}
                    onChange={(e) => setVerificationForm({ ...verificationForm, comments: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={translate('의견을 입력하세요...', 'Enter your comments...', 'コメントを入力...')}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {translate('취소', 'Cancel', 'キャンセル')}
                  </button>
                  <button
                    onClick={() => {
                      if (!verificationForm.email || !verificationForm.labelName || verificationForm.platforms.length === 0) {
                        toast.error(translate('필수 항목을 모두 입력해주세요', 'Please fill in all required fields', '必須項目をすべて入力してください'));
                        return;
                      }
                      // TODO: API 호출
                      toast.success(translate('인증 요청이 제출되었습니다', 'Verification request submitted', '認証リクエストが送信されました'));
                      setShowVerificationModal(false);
                      setVerificationForm({ email: '', labelName: '', platforms: [], comments: '' });
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {translate('제출', 'Submit', '送信')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
