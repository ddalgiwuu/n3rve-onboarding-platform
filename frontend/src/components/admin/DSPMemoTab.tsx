import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import { DSPMetadataOverride, CreateDSPOverrideData } from '@/types/qclog';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';

interface Track {
  id: string;
  titleKo?: string;
  titleEn?: string;
  trackNumber?: number;
}

interface Props {
  submissionId: string;
  tracks?: Track[];
}

const DSPS = ['SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE_MUSIC', 'AMAZON_MUSIC', 'TIDAL', 'DEEZER'] as const;

const emptyForm: CreateDSPOverrideData = {
  dsp: 'SPOTIFY',
  field: '',
  originalValue: '',
  overrideValue: '',
  reason: '',
  trackId: '',
};

function formatDate(dateStr: string, language: string | undefined) {
  const d = new Date(dateStr);
  if (language === 'ko') {
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DSPMemoTab({ submissionId, tracks = [] }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [overrides, setOverrides] = useState<DSPMetadataOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateDSPOverrideData>(emptyForm);
  const [expandedDSPs, setExpandedDSPs] = useState<Set<string>>(new Set());

  const loadOverrides = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getDSPOverrides(submissionId);
      setOverrides(Array.isArray(data) ? data : []);
      // Auto-expand all DSPs on load
      const dsps = new Set<string>((Array.isArray(data) ? data : []).map((o: DSPMetadataOverride) => o.dsp));
      setExpandedDSPs(dsps);
    } catch {
      toast.error(t('DSP 오버라이드를 불러오지 못했습니다', 'Failed to load DSP overrides'));
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dsp || !form.field.trim() || !form.originalValue.trim() || !form.overrideValue.trim()) {
      toast.error(t('DSP, 필드, 원래 값, 오버라이드 값은 필수입니다', 'DSP, field, original value, and override value are required'));
      return;
    }
    try {
      setSubmitting(true);
      const payload: CreateDSPOverrideData = {
        dsp: form.dsp,
        field: form.field,
        originalValue: form.originalValue,
        overrideValue: form.overrideValue,
      };
      if (form.reason?.trim()) payload.reason = form.reason;
      if (form.trackId?.trim()) payload.trackId = form.trackId;
      await adminService.createDSPOverride(submissionId, payload);
      toast.success(t('DSP 오버라이드가 추가되었습니다', 'DSP override added'));
      setForm(emptyForm);
      setShowForm(false);
      loadOverrides();
    } catch {
      toast.error(t('DSP 오버라이드 추가에 실패했습니다', 'Failed to add DSP override'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDSP = (dsp: string) => {
    setExpandedDSPs(prev => {
      const next = new Set(prev);
      if (next.has(dsp)) {
        next.delete(dsp);
      } else {
        next.add(dsp);
      }
      return next;
    });
  };

  const trackLabel = (trackId: string) => {
    const track = tracks.find(tr => tr.id === trackId);
    if (!track) return trackId;
    const title = language === 'ko' ? (track.titleKo || track.titleEn) : (track.titleEn || track.titleKo);
    return track.trackNumber ? `#${track.trackNumber} ${title}` : title;
  };

  // Group overrides by DSP
  const groupedByDSP = overrides.reduce<Record<string, DSPMetadataOverride[]>>((acc, o) => {
    if (!acc[o.dsp]) acc[o.dsp] = [];
    acc[o.dsp].push(o);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('DSP 메타데이터 오버라이드', 'DSP Metadata Overrides')}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({overrides.length})
          </span>
        </h2>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? t('닫기', 'Close') : t('새 오버라이드 추가', 'Add Override')}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('새 DSP 오버라이드', 'New DSP Override')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  DSP *
                </label>
                <Select value={form.dsp} onValueChange={v => setForm(f => ({ ...f, dsp: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DSPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {tracks.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('트랙', 'Track')} ({t('선택', 'optional')})
                  </label>
                  <Select value={form.trackId || 'none'} onValueChange={v => setForm(f => ({ ...f, trackId: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t('트랙 선택', 'Select track')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('전체 앨범', 'Whole album')}</SelectItem>
                      {tracks.map(tr => (
                        <SelectItem key={tr.id} value={tr.id}>
                          {tr.trackNumber ? `#${tr.trackNumber} ` : ''}
                          {language === 'ko' ? (tr.titleKo || tr.titleEn || tr.id) : (tr.titleEn || tr.titleKo || tr.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('필드', 'Field')} *
              </label>
              <Input
                value={form.field}
                onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                placeholder="e.g. title, genre, explicit"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('원래 값', 'Original Value')} *
                </label>
                <Input
                  value={form.originalValue}
                  onChange={e => setForm(f => ({ ...f, originalValue: e.target.value }))}
                  placeholder={t('원래 값을 입력하세요', 'Enter original value')}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('오버라이드 값', 'Override Value')} *
                </label>
                <Input
                  value={form.overrideValue}
                  onChange={e => setForm(f => ({ ...f, overrideValue: e.target.value }))}
                  placeholder={t('오버라이드 값을 입력하세요', 'Enter override value')}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('사유', 'Reason')} ({t('선택', 'optional')})
              </label>
              <Textarea
                value={form.reason || ''}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder={t('오버라이드 사유를 입력하세요', 'Enter reason for override')}
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {t('취소', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? t('저장 중...', 'Saving...') : t('저장', 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped overrides */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          {t('로딩 중...', 'Loading...')}
        </div>
      ) : Object.keys(groupedByDSP).length === 0 ? (
        <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          {t('DSP 오버라이드가 없습니다', 'No DSP overrides found')}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByDSP).map(([dsp, items]) => (
            <div
              key={dsp}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* DSP section header */}
              <button
                onClick={() => toggleDSP(dsp)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedDSPs.has(dsp) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{dsp}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {items.length}
                  </span>
                </div>
              </button>

              {/* Override cards */}
              {expandedDSPs.has(dsp) && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(override => (
                    <div key={override.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {override.field}
                          </span>
                          {override.trackId && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              — {trackLabel(override.trackId)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {override.appliedBy} · {formatDate(override.appliedAt, language)}
                        </span>
                      </div>

                      {/* Value diff */}
                      <div className="flex items-center gap-2 text-sm font-mono flex-wrap">
                        <span className="line-through text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                          {override.originalValue}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                          {override.overrideValue}
                        </span>
                      </div>

                      {override.reason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          {override.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
