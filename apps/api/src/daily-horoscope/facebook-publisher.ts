import fs from 'fs';
import path from 'path';
import { DailyHoroscopePayload } from './types';

export type SocialPublishResult = {
  success: boolean;
  platform: string;
  postId?: string;
  postType?: 'PHOTO';
  imageUsed?: string;
  error?: string;
};

const DAY_BANNER_NAMES: Record<number, string> = {
  0: 'banner-sunday.jpg',
  1: 'banner-monday.jpg',
  2: 'banner-tuesday.jpg',
  3: 'banner-wednesday.jpg',
  4: 'banner-thursday.jpg',
  5: 'banner-friday.jpg',
  6: 'banner-saturday.jpg',
};

export class FacebookPublisher {
  private get pageId(): string | undefined {
    return process.env.FACEBOOK_PAGE_ID?.trim();
  }

  private get pageAccessToken(): string | undefined {
    return process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  }

  private get isEnabled(): boolean {
    const flag = (process.env.FACEBOOK_POSTING_ENABLED ?? 'true').toLowerCase().trim();
    return flag === 'true' || flag === '1';
  }

  private get webhookUrl(): string | undefined {
    return process.env.SOCIAL_WEBHOOK_URL?.trim();
  }

  /**
   * Resolve an authentic banner or photo buffer from candidate directories
   */
  private getPhotoBuffer(dateStr?: string): { buffer: Buffer; fileName: string; mimeType: string } | null {
    let dayOfWeek = 1;
    if (dateStr) {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        dayOfWeek = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
      }
    }

    const bannerFileName = DAY_BANNER_NAMES[dayOfWeek] || 'daily-horoscope-banner.jpg';

    const candidateDirs = [
      path.join(process.cwd(), 'apps/web/public/brand/banners'),
      path.join(process.cwd(), 'public/brand/banners'),
      '/app/apps/web/public/brand/banners',
      '/app/public/brand/banners',
      path.join(process.cwd(), 'apps/web/public/brand'),
      path.join(process.cwd(), 'public/brand'),
      '/app/apps/web/public/brand',
      '/app/public/brand',
    ];

    // 1. Try day-specific banner
    for (const dir of candidateDirs) {
      const p = path.join(dir, bannerFileName);
      if (fs.existsSync(p)) {
        try {
          return { buffer: fs.readFileSync(p), fileName: bannerFileName, mimeType: 'image/jpeg' };
        } catch {
          // ignore
        }
      }
    }

    // 2. Try default daily-horoscope-banner.jpg
    for (const dir of candidateDirs) {
      const p = path.join(dir, 'daily-horoscope-banner.jpg');
      if (fs.existsSync(p)) {
        try {
          return { buffer: fs.readFileSync(p), fileName: 'daily-horoscope-banner.jpg', mimeType: 'image/jpeg' };
        } catch {
          // ignore
        }
      }
    }

    // 3. Fallback to status-images directory
    const statusDirs = [
      path.join(process.cwd(), 'apps/web/public/brand/status-images'),
      path.join(process.cwd(), 'public/brand/status-images'),
      '/app/apps/web/public/brand/status-images',
      '/app/public/brand/status-images',
    ];
    for (const dir of statusDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
          if (files.length > 0) {
            const chosen = files[0];
            const ext = path.extname(chosen).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            return { buffer: fs.readFileSync(path.join(dir, chosen)), fileName: chosen, mimeType: mime };
          }
        } catch {
          // ignore
        }
      }
    }

    return null;
  }

  async publish(horoscope: DailyHoroscopePayload): Promise<SocialPublishResult> {
    if (!this.isEnabled) {
      return { success: false, platform: 'facebook', error: 'Facebook posting is disabled in config' };
    }

    const pageId = this.pageId;
    const token = this.pageAccessToken;

    // Optional webhook publish (Telegram, Zapier, Make, custom)
    if (this.webhookUrl) {
      try {
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'daily_horoscope_published',
            date: horoscope.date,
            dateDisplay: horoscope.dateDisplay,
            socialPost: horoscope.socialPost,
            panchanga: horoscope.panchanga,
          }),
        });
        console.log('[SocialPublisher] Dispatched to social webhook');
      } catch (err) {
        console.warn(
          `[SocialPublisher] Webhook error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!pageId || !token) {
      console.warn(
        '[FacebookPublisher] Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN. Skipped real Facebook post.',
      );
      return {
        success: false,
        platform: 'facebook',
        error: 'Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN',
      };
    }

    // MANDATORY PHOTO REQUIREMENT: Do not post text-only to Facebook!
    const photo = this.getPhotoBuffer(horoscope.date);
    if (!photo) {
      const errMsg = 'Photo required: Cannot publish to Facebook without an image photo';
      console.error(`[FacebookPublisher] ${errMsg}`);
      return {
        success: false,
        platform: 'facebook',
        error: errMsg,
      };
    }

    try {
      const targetEndpoint =
        !pageId || pageId.toLowerCase() === 'me'
          ? 'me'
          : encodeURIComponent(pageId);

      const postPhoto = async (endpoint: string) => {
        const formData = new FormData();
        const captionText = typeof horoscope.socialPost === 'string' ? horoscope.socialPost : '';
        formData.append('caption', captionText);
        formData.append('access_token', token);
        const blob = new Blob([new Uint8Array(photo.buffer)], { type: photo.mimeType });
        formData.append('source', blob, photo.fileName);

        return fetch(`https://graph.facebook.com/v19.0/${endpoint}/photos`, {
          method: 'POST',
          body: formData,
        });
      };

      let response = await postPhoto(targetEndpoint);
      let data = (await response.json()) as any;

      if (!response.ok && targetEndpoint !== 'me' && data?.error?.message?.toLowerCase().includes('global id')) {
        console.warn('[FacebookPublisher] Direct page ID rejected as global ID. Retrying with /me/photos...');
        response = await postPhoto('me');
        data = (await response.json()) as any;
      }

      if (!response.ok) {
        const msg = data?.error?.message || `Facebook API HTTP ${response.status}`;
        console.error(`[FacebookPublisher] Photo upload failed: ${msg}`);
        return { success: false, platform: 'facebook', error: msg };
      }

      console.log(`[FacebookPublisher] Successfully posted photo to Facebook! Post ID: ${data.id}`);
      return {
        success: true,
        platform: 'facebook',
        postId: data.id,
        postType: 'PHOTO',
        imageUsed: photo.fileName,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[FacebookPublisher] Network error: ${msg}`);
      return { success: false, platform: 'facebook', error: msg };
    }
  }
}
