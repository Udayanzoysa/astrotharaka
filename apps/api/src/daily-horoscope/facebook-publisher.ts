import { DailyHoroscopePayload } from './types';

export type SocialPublishResult = {
  success: boolean;
  platform: string;
  postId?: string;
  error?: string;
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

    try {
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: horoscope.socialPost,
          access_token: token,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const msg = data?.error?.message || `Facebook API HTTP ${response.status}`;
        console.error(`[FacebookPublisher] Failed to post: ${msg}`);
        return { success: false, platform: 'facebook', error: msg };
      }

      console.log(`[FacebookPublisher] Successfully posted to Facebook! Post ID: ${data.id}`);
      return { success: true, platform: 'facebook', postId: data.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[FacebookPublisher] Network error: ${msg}`);
      return { success: false, platform: 'facebook', error: msg };
    }
  }
}
