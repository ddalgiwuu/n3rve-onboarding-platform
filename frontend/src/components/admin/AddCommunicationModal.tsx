import React, { useState } from 'react';
import { X } from 'lucide-react';
import { communicationService } from '@/services/communication.service';

interface AddCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  language: string;
  defaultUpc?: string;
}

export default function AddCommunicationModal({ isOpen, onClose, onCreated, language, defaultUpc }: AddCommunicationModalProps) {
  const t = (ko: string, en: string) => language === 'ko' ? ko : en;

  const [form, setForm] = useState({
    upc: defaultUpc || '',
    type: 'GENERAL' as string,
    subject: '',
    summary: '',
    dsp: '',
    senderEmail: '',
    receivedAt: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setError(t('제목을 입력하세요', 'Subject is required'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await communicationService.create({
        ...form,
        source: 'MANUAL',
        receivedAt: new Date(form.receivedAt).toISOString(),
        dsp: form.dsp || undefined,
        senderEmail: form.senderEmail || undefined,
      });
      onCreated();
      onClose();
      setForm({
        upc: defaultUpc || '',
        type: 'GENERAL',
        subject: '',
        summary: '',
        dsp: '',
        senderEmail: '',
        receivedAt: new Date().toISOString().slice(0, 16),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || t('생성 실패', 'Failed to create'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-n3rve-500 focus:border-transparent text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/20">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('커뮤니케이션 추가', 'Add Communication')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>UPC</label>
            <input type="text" name="upc" value={form.upc} onChange={handleChange} className={inputClass} placeholder="e.g. 196871234567" />
          </div>

          <div>
            <label className={labelClass}>{t('유형', 'Type')}</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option value="QC_REJECTION">QC Rejection</option>
              <option value="QC_PASS">QC Pass</option>
              <option value="DSP_TICKET">DSP Ticket</option>
              <option value="MARKETING">Marketing</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>{t('제목', 'Subject')} *</label>
            <input type="text" name="subject" value={form.subject} onChange={handleChange} className={inputClass} placeholder={t('이메일 제목 또는 요약', 'Email subject or summary')} required />
          </div>

          <div>
            <label className={labelClass}>{t('내용', 'Summary')}</label>
            <textarea name="summary" value={form.summary} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder={t('상세 내용...', 'Details...')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>DSP</label>
              <select name="dsp" value={form.dsp} onChange={handleChange} className={inputClass}>
                <option value="">{t('선택안함', 'None')}</option>
                <option value="Spotify">Spotify</option>
                <option value="Apple Music">Apple Music</option>
                <option value="YouTube Music">YouTube Music</option>
                <option value="Melon">Melon</option>
                <option value="Genie">Genie</option>
                <option value="Bugs">Bugs</option>
                <option value="FLO">FLO</option>
                <option value="VIBE">VIBE</option>
                <option value="Amazon Music">Amazon Music</option>
                <option value="Deezer">Deezer</option>
                <option value="Tidal">Tidal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('발신자 이메일', 'Sender Email')}</label>
              <input type="email" name="senderEmail" value={form.senderEmail} onChange={handleChange} className={inputClass} placeholder="sender@example.com" />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('수신일시', 'Received At')}</label>
            <input type="datetime-local" name="receivedAt" value={form.receivedAt} onChange={handleChange} className={inputClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors">
              {t('취소', 'Cancel')}
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-n3rve-500 to-purple-600 hover:from-n3rve-600 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50">
              {submitting ? t('저장 중...', 'Saving...') : t('저장', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
