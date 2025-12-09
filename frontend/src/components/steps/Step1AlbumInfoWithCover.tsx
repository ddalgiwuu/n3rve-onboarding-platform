import { motion } from 'framer-motion';
import { Music2, Calendar, Building2 } from 'lucide-react';
import { CoverArtUploader } from '../submission/CoverArtUploader';

interface AlbumInfo {
  artistName: string;
  albumTitle: string;
  labelName?: string;
  genre: string;
  releaseDate: string;
  albumType: 'SINGLE' | 'EP' | 'ALBUM';
  language: string;
  copyrightYear: string;
}

interface Step1AlbumInfoWithCoverProps {
  albumData: AlbumInfo;
  onAlbumDataChange: (field: string, value: any) => void;
  coverArt: File | string | null;
  onCoverArtChange: (file: File | null) => void;
}

export function Step1AlbumInfoWithCover({
  albumData,
  onAlbumDataChange,
  coverArt,
  onCoverArtChange
}: Step1AlbumInfoWithCoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">앨범 정보</h2>
        <p className="text-gray-400">기본 정보와 커버 아트를 입력하세요</p>
      </div>

      {/* Split Layout: Cover Left, Form Right */}
      <div className="grid md:grid-cols-5 gap-8">
        {/* Left: Cover Art (2 columns) */}
        <div className="md:col-span-2">
          <CoverArtUploader
            value={coverArt}
            onChange={onCoverArtChange}
            required
          />
        </div>

        {/* Right: Album Info (3 columns) */}
        <div className="md:col-span-3 space-y-6">
          {/* Artist Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <div className="flex items-center gap-2">
                <Music2 size={16} />
                아티스트명 <span className="text-red-400">*</span>
              </div>
            </label>
            <input
              type="text"
              value={albumData.artistName}
              onChange={(e) => onAlbumDataChange('artistName', e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 backdrop-blur-md border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
              placeholder="예: Avantgardey"
              required
            />
          </div>

          {/* Album Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              앨범명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={albumData.albumTitle}
              onChange={(e) => onAlbumDataChange('albumTitle', e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 backdrop-blur-md border border-white/10
                text-white placeholder-gray-500
                outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
              placeholder="예: Work It"
              required
            />
          </div>

          {/* Label & Album Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  레이블
                </div>
              </label>
              <input
                type="text"
                value={albumData.labelName || ''}
                onChange={(e) => onAlbumDataChange('labelName', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white placeholder-gray-500
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                placeholder="TV ASAHI MUSIC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                앨범 타입 <span className="text-red-400">*</span>
              </label>
              <select
                value={albumData.albumType}
                onChange={(e) => onAlbumDataChange('albumType', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                required
              >
                <option value="SINGLE">Single</option>
                <option value="EP">EP</option>
                <option value="ALBUM">Album</option>
              </select>
            </div>
          </div>

          {/* Genre & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                장르 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={albumData.genre}
                onChange={(e) => onAlbumDataChange('genre', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white placeholder-gray-500
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                placeholder="Dance, Electronic"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                언어 <span className="text-red-400">*</span>
              </label>
              <select
                value={albumData.language}
                onChange={(e) => onAlbumDataChange('language', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                required
              >
                <option value="KO">한국어</option>
                <option value="EN">English</option>
                <option value="JA">日本語</option>
              </select>
            </div>
          </div>

          {/* Release Date & Copyright Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  발매일 <span className="text-red-400">*</span>
                </div>
              </label>
              <input
                type="date"
                value={albumData.releaseDate}
                onChange={(e) => onAlbumDataChange('releaseDate', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                저작권 연도 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={albumData.copyrightYear}
                onChange={(e) => onAlbumDataChange('copyrightYear', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/5 backdrop-blur-md border border-white/10
                  text-white placeholder-gray-500
                  outline-none focus:ring-2 focus:ring-purple-500/50
                  transition-all
                "
                placeholder="2025"
                min="1900"
                max="2100"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
