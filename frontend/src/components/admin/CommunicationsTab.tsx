import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { communicationService } from '@/services/communication.service';
import AddCommunicationModal from './AddCommunicationModal';

const TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  QC_REJECTION: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  QC_PASS: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  DSP_TICKET: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  MARKETING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  GENERAL: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300' },
};

interface CommunicationsTabProps {
  upc: string;
  language: string;
}

export default function CommunicationsTab({ upc, language }: CommunicationsTabProps) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadLogs = async () => {
    if (!upc) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await communicationService.getByUpc(upc);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load communications:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [upc]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (!upc) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>{t('UPC가 아직 할당되지 않았습니다', 'No UPC assigned yet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('커뮤니케이션 기록', 'Communication Logs')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            UPC: <span className="font-mono">{upc}</span>
            {!loading && ` — ${logs.length} ${t('건', 'entries')}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-n3rve-500 to-purple-600 hover:from-n3rve-600 hover:to-purple-700 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('추가', 'Add')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('아직 커뮤니케이션 기록이 없습니다', 'No communication logs yet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => {
            const badge = TYPE_BADGES[log.type] || TYPE_BADGES.GENERAL;
            return (
              <div
                key={log.id || log._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {log.type?.replace('_', ' ')}
                      </span>
                      {log.dsp && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {log.dsp}
                        </span>
                      )}
                      {log.source && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          via {log.source}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {log.subject}
                    </h4>
                    {log.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {log.summary}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {formatDate(log.receivedAt || log.createdAt)}
                  </div>
                </div>
                {log.senderEmail && (
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {t('발신자', 'From')}: {log.senderEmail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AddCommunicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={loadLogs}
        language={language}
        defaultUpc={upc}
      />
    </div>
  );
}
