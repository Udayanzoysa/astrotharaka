import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: {
    to: string;
    body: string;
  }): Promise<{ ok: boolean; provider: string; detail?: string }> {
    const to = input.to.trim();
    if (!to) {
      return { ok: false, provider: 'none', detail: 'missing phone' };
    }

    // No SMS gateway configured yet — persist outbound message for ops review.
    const dir = join(this.config.get('NOTIFICATIONS_DIR', './uploads/notifications'), 'sms');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = to.replace(/[^0-9+]/g, '_');
    const path = join(dir, `${stamp}-${safeTo}.txt`);
    writeFileSync(path, [`To: ${to}`, '', input.body].join('\n'), 'utf8');
    this.logger.log(`SMS queued (file) to=${to} path=${path}`);
    return { ok: true, provider: 'file', detail: path };
  }
}
