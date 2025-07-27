import { useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';

export default function AdminSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string, ja?: string) => {
    switch (language) {
      case 'ko': return ko;
      case 'en': return en;
      case 'ja': return ja || en;
      default: return en;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{t('제출 관리', 'Submission Management', '提出管理')}</h1>

        <div className="flex gap-4">
          {/* 검색 / Search / 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('아티스트, 앨범명 검색...', 'Search artists, album names...', 'アーティスト、アルバム名を検索...')}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 필터 / Filter / フィルター */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">{t('전체', 'All', '全て')}</option>
            <option value="pending">{t('검토중', 'Under Review', '審査中')}</option>
            <option value="approved">{t('승인됨', 'Approved', '承認済み')}</option>
            <option value="rejected">{t('반려됨', 'Rejected', '却下済み')}</option>
          </select>
        </div>
      </div>

      {/* 제출 목록 테이블 / Submission List Table / 提出リストテーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('제출일', 'Submission Date', '提出日')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('아티스트', 'Artist', 'アーティスト')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('앨범명', 'Album Name', 'アルバム名')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('앨범 유형', 'Album Type', 'アルバムタイプ')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('발매일', 'Release Date', 'リリース日')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('제출자', 'Submitter', '提出者')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('상태', 'Status', 'ステータス')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('작업', 'Actions', 'アクション')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* TODO: API에서 데이터 가져와서 표시 / Fetch and display data from API / APIからデータを取得して表示 */}
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                {t('데이터를 불러오는 중...', 'Loading data...', 'データを読み込み中...')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
