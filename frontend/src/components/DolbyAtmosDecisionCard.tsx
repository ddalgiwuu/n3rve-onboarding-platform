import { Music, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface DolbyAtmosDecisionCardProps {
  onDecision: (hasDolby: boolean) => void;
  trackCount: number;
}

export default function DolbyAtmosDecisionCard({
  onDecision,
  trackCount
}: DolbyAtmosDecisionCardProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('Dolby Atmos 버전이 있나요?', 'Do you have Dolby Atmos versions?', 'Dolby Atmosバージョンはありますか？')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            `${trackCount}개의 스테레오 트랙을 업로드하셨습니다. Dolby Atmos 버전도 배포하시겠습니까?`,
            `You've uploaded ${trackCount} stereo tracks. Would you like to distribute Dolby Atmos versions as well?`,
            `${trackCount}個のステレオトラックをアップロードしました。Dolby Atmosバージョンも配信しますか？`
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yes - Has Dolby Atmos */}
        <button
          onClick={() => onDecision(true)}
          className="group p-8 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('예, Dolby Atmos가 있습니다', 'Yes, I have Dolby Atmos', 'はい、Dolby Atmosがあります')}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t(
                '각 트랙의 Dolby Atmos 버전을 업로드하세요',
                'Upload Dolby Atmos versions for your tracks',
                '各トラックのDolby Atmosバージョンをアップロード'
              )}
            </p>

            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 font-medium">
              {t('계속하기', 'Continue', '続ける')}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* No - Stereo Only */}
        <button
          onClick={() => onDecision(false)}
          className="group p-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg transition-all"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('아니오, Stereo만 사용합니다', 'No, Stereo only', 'いいえ、ステレオのみ')}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t(
                '스테레오 버전만 배포합니다',
                'Distribute stereo versions only',
                'ステレオバージョンのみ配信'
              )}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
              {t('다음 단계로', 'Skip to next step', '次のステップへ')}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      </div>

      {/* Info Panel */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-2">
              {t('Dolby Atmos 안내', 'About Dolby Atmos', 'Dolby Atmosについて')}
            </p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-400">
              <li>• {t('Dolby Atmos는 선택사항입니다', 'Dolby Atmos is optional', 'Dolby Atmosはオプションです')}</li>
              <li>• {t('각 트랙마다 Stereo 파일이 반드시 필요합니다', 'Each track requires a Stereo file', '各トラックにステレオファイルが必要です')}</li>
              <li>• {t('일부 트랙만 Dolby Atmos로 배포할 수 있습니다', 'You can distribute only some tracks in Dolby Atmos', '一部のトラックのみDolby Atmosで配信可能')}</li>
              <li>• {t('나중에 Step 2에서 추가 파일을 관리할 수 있습니다', 'You can manage files in Step 2', 'Step 2でファイルを管理できます')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
