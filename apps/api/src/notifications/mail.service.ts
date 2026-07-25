import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createTransport, type Transporter } from 'nodemailer';
import type { BuiltEmail } from '@astro/shared';
import { SmtpConfigService } from './smtp-config.service';

export type SendMailInput = BuiltEmail & {
  to: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly smtp: SmtpConfigService,
    private readonly config: ConfigService,
  ) {}

  async send(input: SendMailInput): Promise<{ ok: boolean; provider: string; detail?: string }> {
    const cfg = await this.smtp.getConfig();

    if (this.smtp.isReady(cfg)) {
      try {
        const transport = this.createTransport(cfg);
        const info = await transport.sendMail({
          from: cfg.from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          attachments: input.attachments?.map((a) => ({
            filename: a.filename,
            path: a.path,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        this.logger.log(`SMTP sent to=${input.to} id=${info.messageId ?? ''}`);
        return { ok: true, provider: 'smtp', detail: String(info.messageId ?? '') };
      } catch (error) {
        this.logger.warn(
          `SMTP failed, writing file fallback: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    return this.writeFileFallback(input);
  }

  private createTransport(cfg: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  }): Transporter {
    return createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
  }

  private writeFileFallback(input: SendMailInput): {
    ok: boolean;
    provider: string;
    detail?: string;
  } {
    const dir = join(
      this.config.get('NOTIFICATIONS_DIR', './uploads/notifications'),
      'email',
    );
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = input.to.replace(/[^a-z0-9._@-]/gi, '_');
    const path = join(dir, `${stamp}-${safeTo}.txt`);
    const attachNote = input.attachments?.length
      ? `\nAttachments: ${input.attachments.map((a) => a.filename).join(', ')}`
      : '';
    writeFileSync(
      path,
      [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        attachNote,
        '',
        input.text,
        '',
        '--- HTML ---',
        input.html,
      ].join('\n'),
      'utf8',
    );
    this.logger.log(`File email written ${path}`);
    return { ok: true, provider: 'file', detail: path };
  }
}
