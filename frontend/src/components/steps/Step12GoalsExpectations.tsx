import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CAMPAIGN_GOALS } from '@/constants/marketingData';
import { Target, Plus, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface CampaignGoal {
  goalType: string
  responses: string[]
  confidence: number
}

interface Step12GoalsExpectationsProps {
  formData: any
  onChange: (updates: any) => void
}

export default function Step12GoalsExpectations({ formData, onChange }: Step12GoalsExpectationsProps) {
  const { t } = useTranslation();
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());

  const campaignGoals = formData.marketingInfo?.campaignGoals || [];

  const addGoal = () => {
    if (campaignGoals.length >= 3) return;

    const newGoal: CampaignGoal = {
      goalType: '',
      responses: ['', '', '', ''],
      confidence: 50
    };

    onChange({
      marketingInfo: {
        ...formData.marketingInfo,
        campaignGoals: [...campaignGoals, newGoal]
      }
    });

    // Expand the new goal
    setExpandedGoals(prev => new Set(prev).add(campaignGoals.length));
  };

  const removeGoal = (index: number) => {
    const newGoals = campaignGoals.filter((_: any, i: number) => i !== index);
    onChange({
      marketingInfo: {
        ...formData.marketingInfo,
        campaignGoals: newGoals
      }
    });

    // Update expanded goals
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const updateGoal = (index: number, field: keyof CampaignGoal, value: any) => {
    const newGoals = [...campaignGoals];
    newGoals[index] = {
      ...newGoals[index],
      [field]: value
    };

    onChange({
      marketingInfo: {
        ...formData.marketingInfo,
        campaignGoals: newGoals
      }
    });

    // Auto-expand when goal type is selected
    if (field === 'goalType' && value) {
      setExpandedGoals(prev => new Set(prev).add(index));
    }
  };

  const updateResponse = (goalIndex: number, responseIndex: number, value: string) => {
    const newGoals = [...campaignGoals];
    newGoals[goalIndex].responses[responseIndex] = value;

    onChange({
      marketingInfo: {
        ...formData.marketingInfo,
        campaignGoals: newGoals
      }
    });
  };

  const toggleExpanded = (index: number) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getGoalLabel = (goalType: string) => {
    return CAMPAIGN_GOALS.find(g => g.value === goalType)?.label || goalType;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('목표 및 기대사항', 'Goals & Expectations', 'ゴールと期待事項')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            '캠페인의 상위 3개 목표를 선택하고 각각에 대한 세부 정보를 제공해주세요',
            'Select your top 3 goals for your campaign and provide details for each',
            'キャンペーンのトップ3の目標を選択し、それぞれの詳細を提供してください'
          )}
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p>
              {t(
                '우리는 함께하는 여정을 최대한 활용하기 위해 노력합니다. 여러분의 성공이 곧 우리의 성공입니다. 이 섹션에서는 캠페인의 상위 3개 목표와 기대사항을 선택해 주시면, 여러분의 목표와 필요사항을 더 잘 이해하여 최고 품질의 서비스를 제공하고 진정으로 중요한 목표에 집중할 수 있습니다.',
                'We strive to make the most of our journey together, as your success is our success. In this section, we will be asking you to select your top 3 goals and expectations for your campaigns, so we\'ll have a better understanding of your goals and needs. This will help us deliver the highest quality services and focus on the targets that truly matter to you.',
                '私たちは一緒の旅を最大限に活用するよう努めています。あなたの成功は私たちの成功です。このセクションでは、キャンペーンのトップ3の目標と期待事項を選択していただき、あなたの目標とニーズをよりよく理解できるようにします。これにより、最高品質のサービスを提供し、本当に重要なターゲットに集中することができます。'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {campaignGoals.map((goal: CampaignGoal, index: number) => {
          const goalDefinition = CAMPAIGN_GOALS.find(g => g.value === goal.goalType);
          const isExpanded = expandedGoals.has(index);

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Goal Header */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {t(`목표 ${index + 1}`, `Goal ${index + 1}`, `目標 ${index + 1}`)}
                    </span>

                    <select
                      value={goal.goalType}
                      onChange={(e) => updateGoal(index, 'goalType', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">
                        {t('목표를 선택하세요', 'Select a goal', '目標を選択してください')}
                      </option>
                      {CAMPAIGN_GOALS.map(g => (
                        <option
                          key={g.value}
                          value={g.value}
                          disabled={campaignGoals.some((cg: CampaignGoal, i: number) => i !== index && cg.goalType === g.value)}
                        >
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(index)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Goal Details */}
              {goal.goalType && isExpanded && (
                <div className="p-6 space-y-6">
                  {/* Questions */}
                  <div className="space-y-4">
                    {goalDefinition?.questions.map((question, qIndex) => (
                      <div key={qIndex}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {question}
                        </label>
                        <textarea
                          value={goal.responses[qIndex] || ''}
                          onChange={(e) => updateResponse(index, qIndex, e.target.value)}
                          rows={2}
                          placeholder={t('답변을 입력하세요', 'Enter your response', '回答を入力してください')}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Confidence Slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('달성 확신도', 'Confidence in Achievement', '達成への確信度')}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.confidence}
                        onChange={(e) => updateGoal(index, 'confidence', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t('낮음', 'Low', '低い')}</span>
                        <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                          {goal.confidence}%
                        </span>
                        <span>{t('높음', 'High', '高い')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Goal Button */}
        {campaignGoals.length < 3 && (
          <button
            type="button"
            onClick={addGoal}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <Plus className="w-5 h-5" />
            <span>{t('목표 추가', 'Add Goal', '目標を追加')}</span>
          </button>
        )}
      </div>

      {/* Summary */}
      {campaignGoals.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            {t('선택된 목표 요약', 'Selected Goals Summary', '選択された目標の要約')}
          </h3>
          <div className="space-y-2">
            {campaignGoals.map((goal: CampaignGoal, index: number) => (
              goal.goalType && (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    {index + 1}. {getGoalLabel(goal.goalType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {t('확신도', 'Confidence', '確信度')}: {goal.confidence}%
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
