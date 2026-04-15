import { Injectable, Logger } from '@nestjs/common';
import { ParsedMail } from 'mailparser';

export interface ParsedQCEmail {
  upc: string | null;
  type: string;
  severity: string;
  dsp: string | null;
  title: string;
  description: string;
  senderEmail: string | null;
  receivedAt: Date;
  messageId: string | null;
  rawSnippet: string;
}

// Strict: only match digits that are explicitly labeled as UPC/EAN/ISRC.
// Do NOT match bare 13-digit numbers (causes false positives on Google
// notification IDs, tracking numbers, timestamps, etc.).
const UPC_PATTERNS = [
  /\bUPC[:\s#]*\(?(\d{12,13})\)?/i,
  /\bEAN[:\s#]*\(?(\d{12,13})\)?/i,
  /\(UPC\s+(\d{12,13})\)/i,
  /\bbarcode[:\s]*(\d{12,13})/i,
];

// Sender domains whose emails should never be treated as QC communications.
// Purely system/account noise — skip ingestion entirely.
const SKIP_SENDER_DOMAINS = [
  'accounts.google.com',
  'no-reply@accounts.google.com',
  'noreply@google.com',
  'mail-noreply@google.com',
  'googlemail.com',
  'security-noreply@google.com',
];

const TYPE_RULES: Array<{ type: string; severity: string; patterns: RegExp[] }> = [
  {
    type: 'QC_REJECTION',
    severity: 'ERROR',
    patterns: [
      /qc.{0,20}reject/i,
      /\brejected\b/i,
      /\brejection\b/i,
      /반려/i,
      /거절/i,
      /takedown/i,
    ],
  },
  {
    type: 'QC_PASS',
    severity: 'INFO',
    patterns: [
      /qc.{0,20}(pass|approve|accept)/i,
      /\bdelivered\b/i,
      /\bapproved\b/i,
      /통과/i,
      /승인/i,
    ],
  },
  {
    type: 'DSP_TICKET',
    severity: 'WARN',
    patterns: [
      /\bticket\b/i,
      /\bcase\s+#?\d+/i,
      /support\s+request/i,
    ],
  },
  {
    type: 'MARKETING',
    severity: 'INFO',
    patterns: [
      /\bad\s+report\b/i,
      /\bcampaign\b/i,
      /\bplaylist\b/i,
      /\bfeature(d)?\b/i,
      /\bpromote/i,
      /marketing/i,
    ],
  },
];

const DSP_RULES: Array<{ dsp: string; patterns: RegExp[] }> = [
  { dsp: 'SPOTIFY', patterns: [/spotify/i] },
  { dsp: 'APPLE_MUSIC', patterns: [/apple\s?music|itunes/i] },
  { dsp: 'YOUTUBE_MUSIC', patterns: [/youtube/i] },
  { dsp: 'AMAZON_MUSIC', patterns: [/amazon/i] },
  { dsp: 'DEEZER', patterns: [/deezer/i] },
  { dsp: 'TIDAL', patterns: [/tidal/i] },
  { dsp: 'BEATPORT', patterns: [/beatport/i] },
  { dsp: 'FUGA', patterns: [/fuga/i] },
  { dsp: 'MELON', patterns: [/melon/i] },
  { dsp: 'GENIE', patterns: [/genie/i] },
  { dsp: 'BUGS', patterns: [/bugs/i] },
  { dsp: 'VIBE', patterns: [/vibe/i] },
  { dsp: 'FLO', patterns: [/\bflo\b/i] },
];

const FORWARDED_FROM_PATTERNS = [
  /^\s*From:\s*([^\n<]*<[^>]+>|[^\n]+)/im,
  /^\s*보낸\s*사람:\s*([^\n<]*<[^>]+>|[^\n]+)/im,
  /^\s*Von:\s*([^\n<]*<[^>]+>|[^\n]+)/im,
];

const EMAIL_RX = /<([^>]+@[^>]+)>|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  shouldSkip(mail: ParsedMail): boolean {
    const from = (mail.from?.value?.[0]?.address ?? '').toLowerCase();
    if (!from) return false;
    return SKIP_SENDER_DOMAINS.some((d) => from.endsWith(d) || from === d);
  }

  parse(mail: ParsedMail): ParsedQCEmail {
    const subject = mail.subject ?? '';
    const text = (mail.text ?? '').trim();
    const html = (mail.html as string | false) || '';
    const haystack = `${subject}\n${text}\n${stripHtml(html)}`;

    const upc = this.extractUpc(haystack);
    const { type, severity } = this.classifyType(subject, text);
    const dsp = this.extractDsp(subject, text, mail);
    const senderEmail = this.extractOriginalSender(mail, haystack);
    const messageId = (mail.messageId ?? '').replace(/^<|>$/g, '') || null;

    return {
      upc,
      type,
      severity,
      dsp,
      title: subject || '(no subject)',
      description: text.slice(0, 8000) || '(no body)',
      senderEmail,
      receivedAt: mail.date ?? new Date(),
      messageId,
      rawSnippet: text.slice(0, 500),
    };
  }

  private extractUpc(text: string): string | null {
    for (const rx of UPC_PATTERNS) {
      const m = text.match(rx);
      if (m) {
        const digits = m[1] ?? m[0];
        if (/^\d{13}$/.test(digits)) return digits;
      }
    }
    return null;
  }

  private classifyType(subject: string, body: string): {
    type: string;
    severity: string;
  } {
    const blob = `${subject}\n${body}`;
    for (const rule of TYPE_RULES) {
      if (rule.patterns.some((p) => p.test(blob))) {
        return { type: rule.type, severity: rule.severity };
      }
    }
    return { type: 'GENERAL', severity: 'INFO' };
  }

  private extractDsp(
    subject: string,
    body: string,
    mail: ParsedMail,
  ): string | null {
    const from = (mail.from?.text ?? '').toLowerCase();
    const blob = `${subject}\n${body}\n${from}`;
    for (const rule of DSP_RULES) {
      if (rule.patterns.some((p) => p.test(blob))) return rule.dsp;
    }
    return null;
  }

  private extractOriginalSender(
    mail: ParsedMail,
    body: string,
  ): string | null {
    for (const rx of FORWARDED_FROM_PATTERNS) {
      const m = body.match(rx);
      if (m?.[1]) {
        const em = m[1].match(EMAIL_RX);
        if (em) return (em[1] || em[2]).toLowerCase();
      }
    }
    const fromText = mail.from?.value?.[0]?.address;
    return fromText ? fromText.toLowerCase() : null;
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}
