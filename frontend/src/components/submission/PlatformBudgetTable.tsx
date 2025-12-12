import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Plus, Trash2, Calendar, DollarSign, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslationFixed';
import { MARKETING_PLATFORMS, type PlatformBudget } from '@/constants/fuga-data';

interface PlatformBudgetTableProps {
  budgets: PlatformBudget[];
  onChange: (budgets: PlatformBudget[]) => void;
  className?: string;
}

export function PlatformBudgetTable({
  budgets,
  onChange,
  className
}: PlatformBudgetTableProps) {
  const { language } = useTranslation();
  const translate = (ko: string, en: string) => language === 'ko' ? ko : en;

  const handleAdd = () => {
    const newBudget: PlatformBudget = {
      platform: MARKETING_PLATFORMS[0],
      amount: 0,
      startDate: '',
      endDate: '',
      targetAudience: ''
    };
    onChange([...budgets, newBudget]);
  };

  const handleRemove = (index: number) => {
    onChange(budgets.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof PlatformBudget, value: any) => {
    const updated = budgets.map((budget, i) =>
      i === index ? { ...budget, [field]: value } : budget
    );
    onChange(updated);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white">
          {translate('플랫폼별 마케팅 예산', 'Platform Marketing Budgets')}
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-lg
            bg-purple-500/10 hover:bg-purple-500/20
            border border-purple-500/30 hover:border-purple-500/50
            text-purple-400 hover:text-purple-300
            text-sm font-medium
            transition-all
          "
        >
          <Plus size={16} />
          {translate('플랫폼 추가', 'Add Platform')}
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="
          p-8 text-center
          bg-white/5 backdrop-blur-md border border-white/10
          rounded-xl
        ">
          <DollarSign size={48} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">
            {translate('플랫폼별 예산을 추가하세요', 'Add platform budgets')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {translate('각 플랫폼의 마케팅 예산과 기간을 설정할 수 있습니다', 'Set marketing budget and period for each platform')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="
                p-4 space-y-4
                bg-white/5 backdrop-blur-md border border-white/10
                rounded-xl
                hover:border-purple-500/30 transition-all
              "
            >
              {/* Header - Platform + Remove */}
              <div className="flex items-center justify-between gap-3">
                <select
                  value={budget.platform}
                  onChange={(e) => handleUpdate(index, 'platform', e.target.value)}
                  className="
                    flex-1 px-4 py-2 rounded-lg
                    bg-white/5 border border-white/10
                    text-white
                    outline-none focus:ring-2 focus:ring-purple-500/50
                  "
                >
                  {MARKETING_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="
                    p-2 rounded-lg
                    bg-red-500/10 hover:bg-red-500/20
                    border border-red-500/30 hover:border-red-500/50
                    text-red-400 hover:text-red-300
                    transition-all
                  "
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Budget Amount */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  <DollarSign size={12} className="inline mr-1" />
                  {translate('예산 금액 (USD)', 'Budget Amount (USD)')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={budget.amount}
                  onChange={(e) => handleUpdate(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="1000"
                  className="
                    w-full px-4 py-2 rounded-lg
                    bg-white/5 border border-white/10
                    text-white placeholder-gray-500
                    outline-none focus:ring-2 focus:ring-purple-500/50
                  "
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    <Calendar size={12} className="inline mr-1" />
                    {translate('시작일', 'Start Date')}
                  </label>
                  <input
                    type="date"
                    value={budget.startDate}
                    onChange={(e) => handleUpdate(index, 'startDate', e.target.value)}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/5 border border-white/10
                      text-white
                      outline-none focus:ring-2 focus:ring-purple-500/50
                    "
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    <Calendar size={12} className="inline mr-1" />
                    {translate('종료일', 'End Date')}
                  </label>
                  <input
                    type="date"
                    value={budget.endDate}
                    onChange={(e) => handleUpdate(index, 'endDate', e.target.value)}
                    min={budget.startDate}
                    className="
                      w-full px-4 py-2 rounded-lg
                      bg-white/5 border border-white/10
                      text-white
                      outline-none focus:ring-2 focus:ring-purple-500/50
                    "
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  <Users size={12} className="inline mr-1" />
                  {translate('타겟 오디언스', 'Target Audience')}
                </label>
                <input
                  type="text"
                  value={budget.targetAudience}
                  onChange={(e) => handleUpdate(index, 'targetAudience', e.target.value)}
                  placeholder={translate('예: 18-34세, K-Pop 팬', 'e.g., 18-34, K-Pop fans')}
                  className="
                    w-full px-4 py-2 rounded-lg
                    bg-white/5 border border-white/10
                    text-white placeholder-gray-500
                    outline-none focus:ring-2 focus:ring-purple-500/50
                  "
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Total Budget Summary */}
      {budgets.length > 0 && (
        <div className="
          flex items-center justify-between p-4
          bg-gradient-to-r from-purple-500/10 to-pink-500/10
          border border-purple-500/30 rounded-xl
        ">
          <span className="text-sm font-medium text-gray-300">
            {translate('총 예산', 'Total Budget')}
          </span>
          <span className="text-lg font-bold text-purple-400">
            ${budgets.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
          </span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {translate(
          '각 플랫폼별 마케팅 예산, 캠페인 기간, 타겟 오디언스를 설정하세요',
          'Set marketing budget, campaign period, and target audience for each platform'
        )}
      </p>
    </div>
  );
}
