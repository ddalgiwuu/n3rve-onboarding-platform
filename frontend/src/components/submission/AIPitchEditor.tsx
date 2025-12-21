import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import FieldTooltip from '../ui/FieldTooltip';

interface AIPitchEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minChars?: number;
  maxChars: number;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  rows?: number;
  className?: string;
  aiEndpoint?: string; // API endpoint for AI suggestions
  tooltip?: {
    title: string;
    description: string;
    note?: string;
  };
}

interface AISuggestion {
  id: string;
  text: string;
  action: string;
  timestamp: number;
}

export function AIPitchEditor({
  label,
  value,
  onChange,
  minChars,
  maxChars,
  placeholder,
  required = false,
  helpText,
  rows = 6,
  className,
  aiEndpoint = '/api/ai-assist',
  tooltip
}: AIPitchEditorProps) {
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  // Handle AI assist (mock for now - replace with actual API call)
  const handleAIAssist = async (action: string) => {
    setIsGenerating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockSuggestion = {
      id: Date.now().toString(),
      text: generateMockSuggestion(value, action),
      action,
      timestamp: Date.now()
    };

    setAISuggestions(prev => [mockSuggestion, ...prev.slice(0, 2)]);
    setIsGenerating(false);
  };

  // Mock suggestion generator (replace with actual AI)
  const generateMockSuggestion = (text: string, action: string): string => {
    switch (action) {
      case 'expand':
        return text + ' This release showcases innovative production and compelling storytelling that resonates with contemporary audiences.';
      case 'improve':
        return text.replace(/\b(\w+)\b/, '$1, featuring cutting-edge production,');
      case 'shorten':
        return text.slice(0, Math.floor(text.length * 0.7));
      default:
        return text;
    }
  };

  const handleCopySuggestion = (suggestion: AISuggestion) => {
    navigator.clipboard.writeText(suggestion.text);
    setCopiedId(suggestion.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    onChange(suggestion.text.slice(0, maxChars));
  };

  // Calculate status
  const progress = minChars ? (charCount / minChars) * 100 : (charCount / maxChars) * 100;
  const getStatusColor = () => {
    if (minChars && charCount < minChars) return 'text-yellow-400';
    if (charCount > maxChars * 0.9) return 'text-orange-400';
    if (charCount === maxChars) return 'text-red-400';
    return 'text-green-400';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowAIPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={clsx('relative', className)}>
      <div className="flex items-start gap-4">
        {/* Main editor */}
        <div className="flex-1">
          {/* Label */}
          {label && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">
                  {label}
                  {required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {tooltip && (
                  <FieldTooltip
                    title={tooltip.title}
                    description={tooltip.description}
                    note={tooltip.note}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="
                  flex items-center gap-1.5 px-2.5 py-1
                  text-xs font-medium text-purple-400
                  bg-purple-500/10 hover:bg-purple-500/20
                  border border-purple-500/30
                  rounded-lg transition-all
                  hover:shadow-lg hover:shadow-purple-500/20
                "
              >
                <Sparkles size={12} />
                AI Assist
                <kbd className="text-[10px] opacity-70">⌘J</kbd>
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  onChange(e.target.value);
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={rows}
              required={required}
              className={clsx(
                'w-full px-4 py-3 rounded-xl border resize-none outline-none',
                'bg-white/5 backdrop-blur-md border-white/10',
                'text-white placeholder-gray-500',
                'transition-all duration-200',
                isFocused && 'ring-2 ring-purple-500/50 border-purple-500/30',
                'font-sans leading-relaxed'
              )}
            />

            {/* Character count */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className={clsx('text-xs font-medium', getStatusColor())}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isFocused && minChars && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden"
            >
              <motion.div
                className={clsx(
                  'h-full rounded-full',
                  charCount < minChars ? 'bg-yellow-400' : 'bg-green-400'
                )}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ type: 'spring', stiffness: 200 }}
              />
            </motion.div>
          )}

          {/* Help text */}
          {helpText && (
            <p className="mt-2 text-xs text-gray-400">{helpText}</p>
          )}
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="
                w-80 flex-shrink-0
                p-6 rounded-xl
                bg-white/5 backdrop-blur-xl border border-white/10
              "
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">AI Assistant</h4>
                  <p className="text-xs text-gray-400">Improve your pitch</p>
                </div>
              </div>

              {/* AI Actions */}
              <div className="space-y-2 mb-6">
                <button
                  type="button"
                  onClick={() => handleAIAssist('expand')}
                  disabled={isGenerating || !value}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    bg-white/5 hover:bg-white/10 border border-white/10
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  "
                >
                  <Wand2 size={16} className="text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Expand</p>
                    <p className="text-xs text-gray-400">Add more details</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAIAssist('improve')}
                  disabled={isGenerating || !value}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    bg-white/5 hover:bg-white/10 border border-white/10
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <TrendingUp size={16} className="text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Make Compelling</p>
                    <p className="text-xs text-gray-400">Enhance tone & impact</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAIAssist('shorten')}
                  disabled={isGenerating || !value}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    bg-white/5 hover:bg-white/10 border border-white/10
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Zap size={16} className="text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Shorten</p>
                    <p className="text-xs text-gray-400">Make it concise</p>
                  </div>
                </button>
              </div>

              {/* Loading state */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg mb-4"
                >
                  <RefreshCw size={16} className="text-purple-400 animate-spin" />
                  <span className="text-sm text-purple-300">Generating...</span>
                </motion.div>
              )}

              {/* Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-medium text-gray-400 uppercase">
                    Recent Suggestions
                  </h5>
                  {aiSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="
                        p-3 rounded-lg
                        bg-white/5 border border-white/10
                        hover:border-purple-500/30 transition-all
                      "
                    >
                      <p className="text-sm text-gray-300 mb-2 line-clamp-3">
                        {suggestion.text}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="
                            flex-1 flex items-center justify-center gap-1.5
                            px-2 py-1.5 rounded text-xs font-medium
                            bg-purple-500/20 hover:bg-purple-500/30
                            text-purple-300 border border-purple-500/30
                            transition-all
                          "
                        >
                          <Check size={12} />
                          Apply
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySuggestion(suggestion)}
                          className="
                            flex items-center justify-center
                            p-1.5 rounded text-xs
                            bg-white/5 hover:bg-white/10
                            text-gray-400 hover:text-white
                            transition-all
                          "
                        >
                          {copiedId === suggestion.id ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {aiSuggestions.length === 0 && !isGenerating && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-300 space-y-1">
                      <p className="font-medium">Writing Tips:</p>
                      <ul className="space-y-1 text-blue-200/80">
                        <li>• Be specific about the music style</li>
                        <li>• Highlight unique collaboration</li>
                        <li>• Mention notable achievements</li>
                        <li>• Target the right audience</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
