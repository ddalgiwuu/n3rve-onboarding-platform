import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Mail, AlertTriangle, CheckCircle2, Ticket, Megaphone, MessageCircle } from 'lucide-react';
import { communicationService } from '@/services/communication.service';
import { useTranslation } from '@/hooks/useTranslation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AddCommunicationModal from '@/components/admin/AddCommunicationModal';

interface CommunicationLog {
  id: string;
  upc: string;
  type: string;
  source: string;
  subject: string;
  summary: string;
  senderEmail: string;
  dsp: string;
  receivedAt: string;
  outlookMessageId: string;
  metadata: any;
  status: string;
  resolvedBy: string;
  resolvedAt: string;
  createdAt: string;
}

interface Stats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; darkBg: string; border: string; darkBorder: string; icon: React.ReactNode }> = {
  QC_REJECTION: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', border: 'border-red-200', darkBorder: 'dark:border-red-800', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  QC_PASS: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', border: 'border-green-200', darkBorder: 'dark:border-green-800', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  DSP_TICKET: { color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', border: 'border-orange-200', darkBorder: 'dark:border-orange-800', icon: <Ticket className="w-3.5 h-3.5" /> },
  MARKETING: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', border: 'border-blue-200', darkBorder: 'dark:border-blue-800', icon: <Megaphone className="w-3.5 h-3.5" /> },
  GENERAL: { color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100', darkBg: 'dark:bg-gray-700/30', border: 'border-gray-200', darkBorder: 'dark:border-gray-600', icon: <MessageCircle className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; darkBg: string; border: string; darkBorder: string }> = {
  OPEN: { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', border: 'border-yellow-200', darkBorder: 'dark:border-yellow-800' },
  ACKNOWLEDGED: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', border: 'border-blue-200', darkBorder: 'dark:border-blue-800' },
  RESOLVED: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', border: 'border-green-200', darkBorder: 'dark:border-green-800' },
};

export default function AdminCommunications() {
  const { language } = useTranslation();
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [stats, setStats] = useState<Stats>({ byType: {}, byStatus: {}, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const loadStats = useCallback(async () => {
    try {
      const data = await communicationService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load communication stats:', err);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = new Date(fromDate).toISOString();
      if (toDate) params.to = new Date(toDate).toISOString();

      const data = await communicationService.getAll(params);
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load communications:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, fromDate, toDate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    loadStats();
    loadLogs();
  };

  const typeBadge = (type: string) => {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.GENERAL;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.border} ${cfg.darkBorder}`}>
        {cfg.icon}
        {type.replace('_', ' ')}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.border} ${cfg.darkBorder}`}>
        {status}
      </span>
    );
  };

  const selectClass = 'px-3 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent';
  const inputClass = selectClass;

  return (
    <div key={language} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-n3rve-900/20 dark:to-gray-900 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-n3rve-500/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-n3rve-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('커뮤니케이션 관리', 'Communications')}
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-n3rve-500 to-purple-600 hover:from-n3rve-600 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('추가', 'Add')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="bg-white dark:bg-white/10 backdrop-blur-sm dark:backdrop-blur-md rounded-xl p-4 border border-gray-200 dark:border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{type.replace('_', ' ')}</p>
                  <p className={`text-2xl font-bold ${cfg.color}`}>{stats.byType?.[type] || 0}</p>
                </div>
                <div className={`p-2 ${cfg.bg} ${cfg.darkBg} rounded-lg`}>
                  {React.cloneElement(cfg.icon as React.ReactElement<any>, { className: `w-5 h-5 ${cfg.color}` })}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-white dark:bg-white/10 backdrop-blur-sm dark:backdrop-blur-md rounded-xl p-4 border border-gray-200 dark:border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{t('전체', 'Total')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
              </div>
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl p-4 border border-gray-200 dark:border-white/20 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="">{t('모든 유형', 'All Types')}</option>
              <option value="QC_REJECTION">QC Rejection</option>
              <option value="QC_PASS">QC Pass</option>
              <option value="DSP_TICKET">DSP Ticket</option>
              <option value="MARKETING">Marketing</option>
              <option value="GENERAL">General</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">{t('모든 상태', 'All Status')}</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} placeholder="From" title={t('시작일', 'From date')} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} placeholder="To" title={t('종료일', 'To date')} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-gray-200 dark:border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12"><LoadingSpinner /></div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                {t('커뮤니케이션 기록이 없습니다', 'No communication logs found')}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/20">
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">{t('일시', 'Date')}</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">{t('유형', 'Type')}</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">{t('제목', 'Subject')}</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">UPC</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">DSP</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">{t('상태', 'Status')}</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-medium text-sm">{t('발신자', 'Sender')}</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm whitespace-nowrap">{formatDate(log.receivedAt)}</td>
                        <td className="p-4">{typeBadge(log.type)}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm max-w-xs truncate">{log.subject || '-'}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm font-mono">{log.upc || '-'}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">{log.dsp || '-'}</td>
                        <td className="p-4">{statusBadge(log.status)}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm max-w-[160px] truncate">{log.senderEmail || '-'}</td>
                        <td className="p-4">
                          {expandedId === log.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="bg-gray-50 dark:bg-white/5">
                          <td colSpan={8} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{t('내용', 'Summary')}</p>
                                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{log.summary || t('내용 없음', 'No summary')}</p>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t('소스', 'Source')}: </span>
                                  <span className="text-gray-800 dark:text-gray-200">{log.source}</span>
                                </div>
                                {log.outlookMessageId && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Outlook ID: </span>
                                    <span className="text-gray-800 dark:text-gray-200 font-mono text-xs">{log.outlookMessageId}</span>
                                  </div>
                                )}
                                {log.resolvedBy && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('처리자', 'Resolved By')}: </span>
                                    <span className="text-gray-800 dark:text-gray-200">{log.resolvedBy}</span>
                                  </div>
                                )}
                                {log.resolvedAt && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('처리일', 'Resolved At')}: </span>
                                    <span className="text-gray-800 dark:text-gray-200">{formatDate(log.resolvedAt)}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">{t('생성일', 'Created')}: </span>
                                  <span className="text-gray-800 dark:text-gray-200">{formatDate(log.createdAt)}</span>
                                </div>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Metadata: </span>
                                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/20">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(`${page} / ${totalPages} 페이지`, `Page ${page} of ${totalPages}`)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AddCommunicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleRefresh}
        language={language}
      />
    </div>
  );
}
