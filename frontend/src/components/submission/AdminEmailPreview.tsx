import { Mail, Info } from 'lucide-react'
import { useLanguageStore } from '@/store/language.store'
import useSafeStore from '@/hooks/useSafeStore'

interface Props {
  data: any // Using any since SubmissionData type is not available
}

export default function AdminEmailPreview({ data }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language)
  const t = (ko: string, en: string) => language === 'ko' ? ko : en
  
  if (!data.release?.koreanDSP) return null

  const koreanDSP = data.release.koreanDSP
  const artist = data.artist
  const album = data.album
  const release = data.release
  const tracks = data.tracks || []

  // Format release date to Korean format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '')
  }

  // Get title track
  const titleTrack = tracks.find((t: any) => t.isTitle)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('한국 DSP 릴리즈 정보 미리보기', 'Korean DSP Release Information Preview')}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('관리자에게 전송될 이메일 미리보기', 'Email preview to be sent to admin')}
        </p>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Subject:</span>{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {t('[한국 DSP 릴리즈] 신규 음원 발매 정보', '[Korean DSP Release] New Music Release Information')}
              </span>
            </div>

            {/* Body */}
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              {/* New Artist Notice */}
              {koreanDSP.newArtist && (
                <div className="text-red-600 dark:text-red-400 font-bold">
                  {t('※ 신규 아티스트입니다. 프로필 등록이 필요합니다.', '※ This is a new artist. Profile registration is required.')}
                </div>
              )}

              {/* Basic Info */}
              <div>아티스트: {artist?.nameKo} ({artist?.nameEn})</div>
              <div>앨범명: {album?.titleKo} ({album?.titleEn})</div>
              {titleTrack && (
                <div>타이틀곡: {titleTrack.titleKo} ({titleTrack.titleEn})</div>
              )}
              <div>발매일: {release?.consumerReleaseDate && formatDate(release.consumerReleaseDate)}</div>
              {release?.releaseTime && (
                <div>발매시간: {release.releaseTime}</div>
              )}

              {/* Lyrics */}
              {koreanDSP.lyricsAttached && (
                <div className="text-blue-600 dark:text-blue-400">
                  {t('※ 가사 파일이 첨부되었습니다.', '※ Lyrics file has been attached.')}
                </div>
              )}

              {/* Artist Page Links */}
              {(koreanDSP.melonLink || koreanDSP.genieLink || koreanDSP.bugsLink || koreanDSP.vibeLink) && (
                <div className="mt-3 space-y-1">
                  <div className="font-semibold">아티스트 페이지 링크:</div>
                  {koreanDSP.melonLink && (
                    <div className="ml-4">• 멜론: {koreanDSP.melonLink}</div>
                  )}
                  {koreanDSP.genieLink && (
                    <div className="ml-4">• 지니: {koreanDSP.genieLink}</div>
                  )}
                  {koreanDSP.bugsLink && (
                    <div className="ml-4">• 벅스: {koreanDSP.bugsLink}</div>
                  )}
                  {koreanDSP.vibeLink && (
                    <div className="ml-4">• 바이브: {koreanDSP.vibeLink}</div>
                  )}
                </div>
              )}

              {/* Translation Info */}
              {koreanDSP.translation?.hasTranslation && (
                <div className="mt-3 space-y-1">
                  <div className="font-semibold">번역 정보:</div>
                  {koreanDSP.translation.artistNameKo && (
                    <div className="ml-4">
                      • 아티스트명: {koreanDSP.translation.artistNameKo} / {koreanDSP.translation.artistNameEn}
                    </div>
                  )}
                  {koreanDSP.translation.labelNameKo && (
                    <div className="ml-4">
                      • 레이블명: {koreanDSP.translation.labelNameKo} / {koreanDSP.translation.labelNameEn}
                    </div>
                  )}
                </div>
              )}

              {/* Album Credits */}
              {koreanDSP.albumCredits && (
                <div className="mt-3">
                  <div className="font-semibold">앨범 크레딧:</div>
                  <div className="ml-4 whitespace-pre-wrap">{koreanDSP.albumCredits}</div>
                </div>
              )}

              {/* Album Introduction */}
              {release?.albumIntroduction && (
                <div className="mt-3">
                  <div className="font-semibold">앨범 소개:</div>
                  <div className="ml-4 whitespace-pre-wrap">{release.albumIntroduction}</div>
                </div>
              )}

              {/* Notes */}
              {release?.notes && (
                <div className="mt-3">
                  <div className="font-semibold">추가 요청사항:</div>
                  <div className="ml-4 whitespace-pre-wrap">{release.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              이 내용은 한국 DSP 등록을 위해 관리자에게 자동으로 전송됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}