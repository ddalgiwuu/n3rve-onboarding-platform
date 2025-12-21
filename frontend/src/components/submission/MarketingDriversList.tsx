import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Plus, Trash2, GripVertical, Info, AlertCircle } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslationFixed';
import FieldTooltip from '../ui/FieldTooltip';

interface MarketingDriver {
  id: string;
  text: string;
}

interface MarketingDriversListProps {
  drivers: string[];
  onChange: (drivers: string[]) => void;
  maxDrivers?: number;
  className?: string;
  tooltip?: {
    title: string;
    description: string;
    note?: string;
  };
}

export function MarketingDriversList({
  drivers = [],
  onChange,
  maxDrivers = 10,
  className,
  tooltip
}: MarketingDriversListProps) {
  const { language } = useTranslation();
  const translate = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [newDriver, setNewDriver] = useState('');

  // Convert string array to objects with IDs for Reorder
  const driverObjects: MarketingDriver[] = drivers.map((text, index) => ({
    id: `driver-${index}`,
    text
  }));

  const handleAdd = () => {
    if (newDriver.trim() && drivers.length < maxDrivers) {
      onChange([...drivers, newDriver.trim()]);
      setNewDriver('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(drivers.filter((_, i) => i !== index));
  };

  const handleReorder = (newOrder: MarketingDriver[]) => {
    onChange(newOrder.map(d => d.text));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-white">
          {translate('마케팅 드라이버 (Marketing Drivers)', 'Marketing Drivers')}
          <span className="text-gray-400 ml-2 text-xs">
            ({translate(`최대 ${maxDrivers}개`, `Max ${maxDrivers}`)})
          </span>
        </label>
        {tooltip && (
          <FieldTooltip
            title={tooltip.title}
            description={tooltip.description}
            note={tooltip.note}
          />
        )}
      </div>

      {/* Input for new driver */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newDriver}
          onChange={(e) => setNewDriver(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={translate('마케팅 포인트를 입력...', 'Enter marketing point...')}
          disabled={drivers.length >= maxDrivers}
          className="
            flex-1 px-4 py-3 rounded-xl
            bg-white/5 backdrop-blur-md border border-white/10
            text-white placeholder-gray-500
            outline-none focus:ring-2 focus:ring-purple-500/50
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newDriver.trim() || drivers.length >= maxDrivers}
          title={!newDriver.trim()
            ? translate('마케팅 포인트를 입력하세요', 'Enter marketing point first')
            : translate('마케팅 드라이버 추가', 'Add marketing driver')
          }
          className={clsx(
            'px-4 py-3 rounded-xl font-medium transition-all',
            !newDriver.trim() || drivers.length >= maxDrivers
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50 text-gray-200'
              : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 hover:text-purple-300 cursor-pointer shadow-lg hover:shadow-xl'
          )}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 min-h-[20px]">
        {!newDriver.trim() && drivers.length < maxDrivers && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={12} />
            {translate('마케팅 포인트를 입력 후 추가 버튼을 클릭하거나 Enter 키를 누르세요', 'Enter marketing point and click Add or press Enter')}
          </p>
        )}
        {drivers.length >= maxDrivers && (
          <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {translate(`최대 ${maxDrivers}개까지만 추가할 수 있습니다`, `Maximum ${maxDrivers} items allowed`)}
          </p>
        )}
      </div>

      {/* List of drivers (reorderable) */}
      {driverObjects.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-2">
            <span>{translate('드래그하여 순서 변경', 'Drag to reorder')}</span>
            <span>{driverObjects.length} / {maxDrivers}</span>
          </div>

          <Reorder.Group
            axis="y"
            values={driverObjects}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {driverObjects.map((driver, index) => (
              <Reorder.Item
                key={driver.id}
                value={driver}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="
                    flex items-center gap-3 p-3
                    bg-white/5 backdrop-blur-md border border-white/10
                    rounded-xl hover:border-purple-500/30
                    transition-all group
                  "
                >
                  {/* Drag Handle */}
                  <GripVertical
                    size={18}
                    className="text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0"
                  />

                  {/* Number Badge */}
                  <div className="
                    flex items-center justify-center
                    w-6 h-6 rounded-full
                    bg-purple-500/20 text-purple-400
                    text-xs font-bold
                  ">
                    {index + 1}
                  </div>

                  {/* Driver Text */}
                  <p className="flex-1 text-sm text-white">
                    {driver.text}
                  </p>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="
                      p-1.5 rounded-lg
                      bg-red-500/10 hover:bg-red-500/20
                      border border-red-500/30 hover:border-red-500/50
                      text-red-400 hover:text-red-300
                      transition-all opacity-0 group-hover:opacity-100
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      ) : (
        <div className="
          p-8 text-center
          bg-white/5 backdrop-blur-md border border-white/10
          rounded-xl
        ">
          <p className="text-gray-400 text-sm">
            {translate('마케팅 드라이버를 추가하세요', 'Add marketing drivers')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {translate('예: TikTok 챌린지, 인플루언서 협업, 라디오 프로모션', 'e.g., TikTok challenge, Influencer collab, Radio promo')}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {translate(
          '주요 마케팅 전략과 실행 계획을 순서대로 나열하세요',
          'List key marketing strategies and execution plans in order'
        )}
      </p>
    </div>
  );
}
