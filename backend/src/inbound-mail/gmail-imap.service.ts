import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow, FetchMessageObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailParserService } from './email-parser.service';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';

const RECONNECT_DELAY_MS = 15_000;
const IDLE_REFRESH_MS = 25 * 60 * 1000;

@Injectable()
export class GmailImapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailImapService.name);
  private client: ImapFlow | null = null;
  private stopping = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly parser: EmailParserService,
    private readonly admin: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD');
    if (!user || !pass) {
      this.logger.warn(
        'GMAIL_USER or GMAIL_APP_PASSWORD not set — Gmail IMAP watcher disabled',
      );
      return;
    }
    this.connect().catch((err) => {
      this.logger.error('Initial IMAP connect failed', err.stack ?? err);
      this.scheduleReconnect();
    });
  }

  async onModuleDestroy() {
    this.stopping = true;
    if (this.idleTimer) clearInterval(this.idleTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        // ignore
      }
    }
  }

  private async connect() {
    const user = this.config.get<string>('GMAIL_USER')!;
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD')!;
    const folder = this.config.get<string>('GMAIL_IMAP_FOLDER') || 'INBOX';

    this.client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    this.client.on('error', (err) => {
      this.logger.error('IMAP error', err?.stack ?? err);
    });
    this.client.on('close', () => {
      this.logger.warn('IMAP connection closed');
      if (!this.stopping) this.scheduleReconnect();
    });

    await this.client.connect();
    this.logger.log(`Connected to Gmail IMAP as ${user}`);

    const lock = await this.client.getMailboxLock(folder);
    lock.release();

    this.client.on('exists', () => {
      this.processNewMessages().catch((err) =>
        this.logger.error('processNewMessages failed', err.stack ?? err),
      );
    });

    await this.processNewMessages();
    await this.enterIdle(folder);

    this.idleTimer = setInterval(async () => {
      try {
        await this.refreshIdle(folder);
      } catch (err: any) {
        this.logger.error('IDLE refresh failed', err.stack ?? err);
      }
    }, IDLE_REFRESH_MS);
  }

  private async enterIdle(folder: string) {
    if (!this.client) return;
    try {
      await this.client.mailboxOpen(folder);
    } catch (err: any) {
      this.logger.error(`mailboxOpen(${folder}) failed`, err.stack ?? err);
    }
  }

  private async refreshIdle(folder: string) {
    if (!this.client || this.stopping) return;
    try {
      if (typeof (this.client as any).idleReset === 'function') {
        await (this.client as any).idleReset();
      } else {
        await this.client.noop();
      }
    } catch {
      await this.enterIdle(folder);
    }
  }

  private async processNewMessages() {
    if (!this.client) return;
    const mailbox = (this.client as any).mailbox;
    if (!mailbox) return;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uids = await this.client.search({ since }, { uid: true });
    if (!uids || uids.length === 0) return;

    for await (const message of this.client.fetch(
      uids as any,
      { uid: true, source: true, envelope: true, flags: true },
      { uid: true },
    )) {
      try {
        await this.handleMessage(message);
      } catch (err: any) {
        this.logger.error(
          `handleMessage failed (uid=${message.uid})`,
          err.stack ?? err,
        );
      }
    }
  }

  private async handleMessage(message: FetchMessageObject) {
    if (!message.source) return;
    const parsed = await simpleParser(message.source as Buffer);
    const qc = this.parser.parse(parsed);

    if (!qc.messageId) {
      this.logger.debug('Skipping message without Message-ID');
      return;
    }

    const existing = await this.prisma.qCLog.findUnique({
      where: { outlookMessageId: qc.messageId },
    });
    if (existing) {
      this.logger.debug(`Dedup: already ingested ${qc.messageId}`);
      return;
    }

    if (!qc.upc) {
      this.logger.warn(
        `No UPC found in email "${qc.title}" from ${qc.senderEmail} — storing as UNMATCHED`,
      );
    }

    await this.admin.createQCLogByUpc({
      upc: qc.upc ?? 'UNMATCHED',
      source: 'AUTO_EMAIL',
      type: qc.type,
      severity: qc.severity,
      dsp: qc.dsp ?? undefined,
      title: qc.title,
      description: qc.description,
      senderEmail: qc.senderEmail ?? undefined,
      receivedAt: qc.receivedAt.toISOString(),
      outlookMessageId: qc.messageId,
      metadata: {
        ingestedBy: 'gmail-imap',
        rawSnippet: qc.rawSnippet,
      },
    });

    this.logger.log(
      `Ingested QC email "${qc.title}" upc=${qc.upc ?? 'UNMATCHED'} type=${qc.type}`,
    );
  }

  private scheduleReconnect() {
    if (this.stopping) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.logger.log('Reconnecting IMAP...');
      this.connect().catch((err) => {
        this.logger.error('Reconnect failed', err.stack ?? err);
        this.scheduleReconnect();
      });
    }, RECONNECT_DELAY_MS);
  }
}
