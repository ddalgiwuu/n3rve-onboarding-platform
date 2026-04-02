export interface QCLog {
  id: string;
  submissionId: string;
  trackId?: string;
  source: 'FUGA' | 'INTERNAL' | 'MANUAL' | 'EMAIL';
  type: 'QC_ERROR' | 'QC_WARNING' | 'DSP_OVERRIDE' | 'NOTE' | 'REQUEST';
  severity: 'INFO' | 'WARN' | 'ERROR';
  dsp?: string;
  title: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  field?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  createdBy: string;
  resolvedBy?: string;
  resolvedAt?: string;
  senderEmail?: string;
  receivedAt?: string;
  outlookMessageId?: string;
  upc?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DSPMetadataOverride {
  id: string;
  submissionId: string;
  trackId?: string;
  dsp: string;
  field: string;
  originalValue: string;
  overrideValue: string;
  reason?: string;
  appliedBy: string;
  appliedAt: string;
  createdAt: string;
}

export interface CreateQCLogData {
  trackId?: string;
  source: string;
  type: string;
  severity: string;
  dsp?: string;
  title: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  field?: string;
}

export interface CreateDSPOverrideData {
  trackId?: string;
  dsp: string;
  field: string;
  originalValue: string;
  overrideValue: string;
  reason?: string;
}
