import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useLanguageStore } from '@/store/language.store';
import useSafeStore from '@/hooks/useSafeStore';
import { adminService } from '@/services/admin.service';
import { QCLog, CreateQCLogData } from '@/types/qclog';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
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

const SOURCES = ['FUGA', 'INTERNAL', 'MANUAL', 'EMAIL'] as const;
const TYPES = ['QC_ERROR', 'QC_WARNING', 'DSP_OVERRIDE', 'NOTE', 'REQUEST'] as const;
const SEVERITIES = ['ERROR', 'WARN', 'INFO'] as const;
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
const DSPS = ['SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE_MUSIC', 'AMAZON_MUSIC', 'TIDAL', 'DEEZER'] as const;

function severityDot(severity: string) {
  if (severity === 'ERROR') return 'bg-red-500';
  if (severity === 'WARN') return 'bg-amber-500';
  return 'bg-blue-500';
}

function sourceBadgeClass(source: string) {
  switch (source) {
    case 'FUGA': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    case 'INTERNAL': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case 'MANUAL': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    case 'EMAIL': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'OPEN': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'IN_PROGRESS': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'RESOLVED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'DISMISSED': return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
  }
}

function relativeTime(dateStr: string, language: string | undefined) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (language === 'ko') {
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function isOutgoing(log: QCLog): boolean {
  const sender = log.senderEmail?.toLowerCase() || '';
  return sender.includes('ryan') || sender.includes('n3rve.com') || sender.includes('n3rve.co') || log.createdBy === 'nanoclaw-auto' && !sender;
}

function threadKey(title: string): string {
  return title
    .replace(/^(Re:\s*|Fwd:\s*|FW:\s*|RE:\s*|Subject:\s*)+/gi, '')
    .replace(/^#\d+\s*-\s*/, '')
    .trim()
    .toLowerCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function threadDisplaySubject(title: string): string {
  return title
    .replace(/^(Re:\s*|Fwd:\s*|FW:\s*|RE:\s*|Subject:\s*)+/gi, '')
    .replace(/^#\d+\s*-\s*/, '')
    .trim();
}

const KNOWN_SENDERS: Record<string, { name: string; role: string; color: string }> = {
  'support@fuga.com': { name: 'FUGA Support', role: 'Support', color: 'bg-orange-500' },
  'emma.levitz@fuga.com': { name: 'Emma Levitz', role: 'Client Dir.', color: 'bg-pink-500' },
  'anj.punzalan@fuga.com': { name: 'Anj Punzalan', role: 'Support', color: 'bg-teal-500' },
  'anita.zagar@fuga.com': { name: 'Anita Zagar', role: 'Account Mgr', color: 'bg-cyan-500' },
  'semin.seo@fuga.com': { name: 'Semin Seo', role: 'Marketing', color: 'bg-blue-500' },
  'ivana.anastasia@fuga.com': { name: 'Ivana Anastasia', role: 'Support', color: 'bg-violet-500' },
  'hannah.h@fuga.com': { name: 'Hannah H.', role: 'Support', color: 'bg-rose-500' },
  'marketing-services@fuga.com': { name: 'FUGA Marketing', role: 'Auto', color: 'bg-indigo-500' },
  'catalogdevelopment-noreply@fuga.com': { name: 'FUGA Catalog', role: 'Auto', color: 'bg-gray-500' },
};

function senderInfo(log: QCLog): { name: string; role: string; color: string; initial: string } {
  if (isOutgoing(log)) return { name: 'Ryan', role: 'N3RVE', color: 'bg-purple-500', initial: 'R' };
  const email = log.senderEmail?.toLowerCase() || '';
  const known = KNOWN_SENDERS[email];
  if (known) return { ...known, initial: known.name.charAt(0) };
  if (email) {
    const local = email.split('@')[0].replace(/[._-]/g, ' ');
    const name = local.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { name, role: email.split('@')[1]?.replace('.com','') || '', color: 'bg-gray-500', initial: name.charAt(0) };
  }
  return { name: 'System', role: '', color: 'bg-gray-400', initial: 'S' };
}

function getMessageDate(log: QCLog): string {
  return log.receivedAt || log.createdAt;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${day[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const emptyForm: CreateQCLogData = {
  source: 'MANUAL',
  type: 'NOTE',
  severity: 'INFO',
  dsp: '',
  trackId: '',
  title: '',
  description: '',
  beforeValue: '',
  afterValue: '',
  field: '',
};

export default function QCLogTab({ submissionId, tracks = [] }: Props) {
  const language = useSafeStore(useLanguageStore, (state) => state.language);
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [logs, setLogs] = useState<QCLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateQCLogData>(emptyForm);

  // Filters
  const [filterSource, setFilterSource] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDSP, setFilterDSP] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const toggleThread = (key: string) => {
    setExpandedThreads(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Separate email logs (threaded) from non-email logs (flat)
  const { emailThreads, nonEmailLogs } = useMemo(() => {
    const emailLogs = logs.filter(l => l.source === 'EMAIL');
    const nonEmail = logs.filter(l => l.source !== 'EMAIL');

    const threadMap = new Map<string, QCLog[]>();
    for (const log of emailLogs) {
      const key = threadKey(log.title);
      if (!threadMap.has(key)) threadMap.set(key, []);
      threadMap.get(key)!.push(log);
    }

    // Sort messages within each thread chronologically (oldest first) using receivedAt
    for (const [, msgs] of threadMap) {
      msgs.sort((a, b) => new Date(getMessageDate(a)).getTime() - new Date(getMessageDate(b)).getTime());
    }

    // Sort threads by most recent message (newest thread first)
    const sortedThreads = Array.from(threadMap.entries()).sort((a, b) => {
      const aLatest = new Date(getMessageDate(a[1][a[1].length - 1])).getTime();
      const bLatest = new Date(getMessageDate(b[1][b[1].length - 1])).getTime();
      return bLatest - aLatest;
    });

    return { emailThreads: sortedThreads, nonEmailLogs: nonEmail };
  }, [logs]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (filterSource) filters.source = filterSource;
      if (filterSeverity) filters.severity = filterSeverity;
      if (filterStatus) filters.status = filterStatus;
      if (filterDSP) filters.dsp = filterDSP;
      const data = await adminService.getQCLogs(submissionId, filters);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('QC 로그를 불러오지 못했습니다', 'Failed to load QC logs'));
    } finally {
      setLoading(false);
    }
  }, [submissionId, filterSource, filterSeverity, filterStatus, filterDSP]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(t('제목과 설명을 입력해주세요', 'Title and description are required'));
      return;
    }
    try {
      setSubmitting(true);
      const payload: CreateQCLogData = {
        source: form.source,
        type: form.type,
        severity: form.severity,
        title: form.title,
        description: form.description,
      };
      if (form.dsp) payload.dsp = form.dsp;
      if (form.trackId) payload.trackId = form.trackId;
      if (form.type === 'DSP_OVERRIDE') {
        if (form.field) payload.field = form.field;
        if (form.beforeValue) payload.beforeValue = form.beforeValue;
        if (form.afterValue) payload.afterValue = form.afterValue;
      }
      await adminService.createQCLog(submissionId, payload);
      toast.success(t('QC 로그가 추가되었습니다', 'QC log added'));
      setForm(emptyForm);
      setShowForm(false);
      loadLogs();
    } catch {
      toast.error(t('QC 로그 추가에 실패했습니다', 'Failed to add QC log'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (logId: string, status: string) => {
    try {
      await adminService.updateQCLogStatus(logId, status);
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: status as QCLog['status'] } : l));
      toast.success(t('상태가 업데이트되었습니다', 'Status updated'));
    } catch {
      toast.error(t('상태 업데이트에 실패했습니다', 'Failed to update status'));
    }
  };

  const trackLabel = (trackId: string) => {
    const track = tracks.find(tr => tr.id === trackId);
    if (!track) return trackId;
    const title = language === 'ko' ? (track.titleKo || track.titleEn) : (track.titleEn || track.titleKo);
    return track.trackNumber ? `#${track.trackNumber} ${title}` : title;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('QC 로그', 'QC Logs')}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({logs.length})
          </span>
        </h2>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? t('닫기', 'Close') : t('새 로그 추가', 'Add Log')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={filterSource || 'all'} onValueChange={v => setFilterSource(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t('소스', 'Source')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('전체 소스', 'All Sources')}</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterSeverity || 'all'} onValueChange={v => setFilterSeverity(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t('심각도', 'Severity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('전체 심각도', 'All Severities')}</SelectItem>
            {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t('상태', 'Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('전체 상태', 'All Statuses')}</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterDSP || 'all'} onValueChange={v => setFilterDSP(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="DSP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('전체 DSP', 'All DSPs')}</SelectItem>
            {DSPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('새 QC 로그', 'New QC Log')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('소스', 'Source')}
                </label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('유형', 'Type')}
                </label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('심각도', 'Severity')}
                </label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  DSP ({t('선택', 'optional')})
                </label>
                <Select value={form.dsp || 'none'} onValueChange={v => setForm(f => ({ ...f, dsp: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('선택', 'Select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('없음', 'None')}</SelectItem>
                    {DSPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('제목', 'Title')} *
              </label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('로그 제목을 입력하세요', 'Enter log title')}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('설명', 'Description')} *
              </label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t('상세 설명을 입력하세요', 'Enter detailed description')}
                className="text-xs min-h-[60px]"
              />
            </div>

            {form.type === 'DSP_OVERRIDE' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('필드', 'Field')}
                  </label>
                  <Input
                    value={form.field || ''}
                    onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                    placeholder="e.g. title"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('이전 값', 'Before')}
                  </label>
                  <Input
                    value={form.beforeValue || ''}
                    onChange={e => setForm(f => ({ ...f, beforeValue: e.target.value }))}
                    placeholder={t('이전 값', 'Before value')}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('이후 값', 'After')}
                  </label>
                  <Input
                    value={form.afterValue || ''}
                    onChange={e => setForm(f => ({ ...f, afterValue: e.target.value }))}
                    placeholder={t('이후 값', 'After value')}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

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

      {/* Timeline */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          {t('로딩 중...', 'Loading...')}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          {t('QC 로그가 없습니다', 'No QC logs found')}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Email threads — grouped and collapsible */}
          {emailThreads.map(([key, messages]) => {
            const isExpanded = expandedThreads[key] ?? false;
            const latestMsg = messages[messages.length - 1];
            const subject = threadDisplaySubject(messages[0].title);
            const latestStatus = latestMsg.status;
            const hasDSP = messages.some(m => m.dsp);
            const dspLabel = messages.find(m => m.dsp)?.dsp;

            return (
              <div
                key={key}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Thread header */}
                <button
                  type="button"
                  onClick={() => toggleThread(key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {subject || '(no subject)'}
                    </span>
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {messages.length}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusBadgeClass(latestStatus)}`}>
                      {latestStatus}
                    </span>
                    {hasDSP && dspLabel && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {dspLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {formatDate(getMessageDate(latestMsg))}
                  </span>
                </button>

                {/* Expanded thread: timeline messages */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      {/* Vertical timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600" />

                      {messages.map((msg, idx) => {
                        const sender = senderInfo(msg);
                        const outgoing = isOutgoing(msg);
                        const msgDate = getMessageDate(msg);
                        const prevDate = idx > 0 ? getMessageDate(messages[idx - 1]) : null;
                        const dayChanged = prevDate && new Date(msgDate).toDateString() !== new Date(prevDate).toDateString();

                        return (
                          <React.Fragment key={msg.id}>
                            {/* Date separator */}
                            {(idx === 0 || dayChanged) && (
                              <div className="relative flex items-center py-2 pl-10">
                                <div className="absolute left-[13px] w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-500 border-2 border-white dark:border-gray-800 z-10" />
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                  {new Date(msgDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}

                            {/* Message card */}
                            <div className="relative pl-10 py-1.5 group">
                              {/* Timeline dot */}
                              <div className={`absolute left-[11px] top-4 w-3 h-3 rounded-full ${sender.color} border-2 border-white dark:border-gray-800 z-10`} />

                              <div className={`rounded-lg border p-3 ${
                                outgoing
                                  ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                              }`}>
                                {/* Header: sender tag + date + status */}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {/* Avatar */}
                                    <div className={`w-6 h-6 rounded-full ${sender.color} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                                      {sender.initial}
                                    </div>
                                    {/* Name + role tag */}
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{sender.name}</span>
                                    {sender.role && (
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        outgoing
                                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                      }`}>
                                        {sender.role}
                                      </span>
                                    )}
                                    {outgoing && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                                        {t('보냄', 'SENT')}
                                      </span>
                                    )}
                                    {!outgoing && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                        {t('받음', 'RECV')}
                                      </span>
                                    )}
                                    {(msg.severity === 'ERROR' || msg.severity === 'WARN') && (
                                      <span className={`inline-block w-2 h-2 rounded-full ${severityDot(msg.severity)}`} />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatFullDate(msgDate)}
                                    </span>
                                    <Select value={msg.status} onValueChange={v => handleStatusChange(msg.id, v)}>
                                      <SelectTrigger className={`h-5 text-[10px] px-1.5 py-0 border-0 rounded w-auto gap-0.5 ${statusBadgeClass(msg.status)}`}>
                                        <SelectValue />
                                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUSES.map(s => (
                                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Email body — full content */}
                                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.description}
                                </div>

                                {/* Metadata: attachments */}
                                {msg.metadata?.attachments && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {(msg.metadata.attachments as any[]).map((att: any, i: number) => (
                                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                                        📎 {att.name || 'attachment'}
                                        {att.size && <span className="text-gray-400">({Math.round(att.size/1024)}KB)</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Non-email logs — flat list (existing style) */}
          {nonEmailLogs.map(log => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Severity dot */}
                <div className="mt-1 flex-shrink-0">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${severityDot(log.severity)}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{log.title}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${sourceBadgeClass(log.source)}`}>
                        {log.source}
                      </span>
                      {log.dsp && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                          {log.dsp}
                        </span>
                      )}
                      {log.trackId && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {trackLabel(log.trackId)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {relativeTime(log.createdAt, language)}
                      </span>
                      <Select
                        value={log.status}
                        onValueChange={v => handleStatusChange(log.id, v)}
                      >
                        <SelectTrigger className={`h-6 text-xs px-2 py-0 border-0 rounded w-auto gap-1 ${statusBadgeClass(log.status)}`}>
                          <SelectValue />
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{log.description}</p>

                  {log.type === 'DSP_OVERRIDE' && log.field && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-gray-500 dark:text-gray-400">{log.field}:</span>
                      {log.beforeValue && (
                        <span className="line-through text-red-500 dark:text-red-400">&ldquo;{log.beforeValue}&rdquo;</span>
                      )}
                      {log.beforeValue && log.afterValue && (
                        <span className="text-gray-400">&rarr;</span>
                      )}
                      {log.afterValue && (
                        <span className="text-green-600 dark:text-green-400">&ldquo;{log.afterValue}&rdquo;</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
