import { buildLahiriChart } from './chart/lahiri-chart';
import { buildLocalChart } from './chart/local-chart';
import type { ChartResult } from './chart/types';

export type BirthChartInput = {
  birthProfileId: string;
  fullName: string;
  birthDate: string;
  birthTime: string | null;
  unknownBirthTime: boolean;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  language: string;
};

function isChartResult(value: unknown): value is ChartResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Boolean(v.lagna && Array.isArray(v.planets));
}

export async function calculateChart(input: BirthChartInput): Promise<ChartResult> {
  const engineUrl = process.env.ASTROLOGY_ENGINE_URL ?? 'http://localhost:8001';

  try {
    const response = await fetch(`${engineUrl}/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthProfileId: input.birthProfileId,
        fullName: input.fullName,
        birthDate: input.birthDate,
        birthTime: input.unknownBirthTime ? null : input.birthTime,
        unknownBirthTime: input.unknownBirthTime,
        latitude: input.latitude ?? 6.9271,
        longitude: input.longitude ?? 79.8612,
        timezone: input.timezone,
        language: input.language,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Astrology engine error ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`,
      );
    }

    const json: unknown = await response.json();
    if (isChartResult(json) && !json.placeholder) {
      return {
        ...json,
        houses: json.houses?.length ? json.houses : [],
        themes: json.themes?.length ? json.themes : [],
        notes: json.notes?.length ? json.notes : [],
      };
    }

    if (isChartResult(json) && json.placeholder) {
      throw new Error('Astrology engine returned placeholder chart');
    }

    throw new Error('Unexpected astrology engine response shape');
  } catch (error) {
    console.warn(
      `[astrology-client] engine unavailable (${
        error instanceof Error ? error.message : 'unknown'
      }) — using worker Lahiri calculator`,
    );

    try {
      return buildLahiriChart({
        birthProfileId: input.birthProfileId,
        fullName: input.fullName,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        unknownBirthTime: input.unknownBirthTime,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone,
        language: input.language,
      });
    } catch (localError) {
      console.error(
        `[astrology-client] Lahiri local chart failed: ${
          localError instanceof Error ? localError.message : 'unknown'
        }`,
      );
      const allowStub =
        process.env.ALLOW_PLACEHOLDER_CHART === 'true' &&
        (process.env.NODE_ENV ?? '').toLowerCase() !== 'production';
      if (!allowStub) {
        throw new Error(
          `Chart calculation failed (engine + Lahiri). ${
            localError instanceof Error ? localError.message : 'unknown'
          }`,
        );
      }
      console.warn('[astrology-client] ALLOW_PLACEHOLDER_CHART=true — using stub chart');
      return buildLocalChart({
        birthProfileId: input.birthProfileId,
        fullName: input.fullName,
        birthDate: input.birthDate,
        unknownBirthTime: input.unknownBirthTime,
        latitude: input.latitude,
        longitude: input.longitude,
        language: input.language,
        source: 'worker-local',
      });
    }
  }
}
