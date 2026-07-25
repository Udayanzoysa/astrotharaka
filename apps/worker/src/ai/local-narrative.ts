import { localizeChart, planetToSi, signToSi } from './localize-chart';
import {
  fullReportJsonToSections,
  isFullReportNarrative,
  THARAKA_BRAND_EN,
  THARAKA_BRAND_SI,
} from './full-report';
import { guestSectionTitles, isGuestNarrative, reportSectionTitles } from './prompt';
import { buildSalutation } from './salutation';
import type { NarrativeAdapter, NarrativeInput, NarrativeResult, NarrativeSection } from './types';
import { sectionsToPlainText } from './types';

const SI = {
  softUnknown:
    '\u0d8b\u0db4\u0db1\u0dca \u0dc0\u0dda\u0dbd\u0dcf\u0dc0 \u0db1\u0dd2\u0dba\u0db8 \u0db1\u0ddc\u0daf\u0db1\u0dca\u0db1\u0dcf \u0db1\u0dd2\u0dc3\u0dcf \u0d9a\u0dcf\u0dbd \u0d9c\u0dd0\u0db1 \u0d9a\u0dd2\u0dba\u0db1 \u0daf\u0dda\u0dc0\u0dbd\u0dca \u0da7\u0dd2\u0d9a\u0d9a\u0dca \u0db8\u0dd8\u0daf\u0dd4\u0dc0 \u0dad\u0dd2\u0dba\u0dd9\u0db1\u0dc0\u0dcf.',
  softKnown:
    '\u0d8b\u0db4\u0db1\u0dca \u0dc0\u0dda\u0dbd\u0dcf\u0dc0 \u0dad\u0dd2\u0dba\u0dd9\u0db1 \u0db1\u0dd2\u0dc3\u0dcf \u0db7\u0dcf\u0dc0 \u0d9c\u0dd0\u0db1 \u0d9a\u0dad\u0dcf \u0d9a\u0dbb\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca.',
  disclaimer:
    '\u0da2\u0dca\u200d\u0dba\u0ddc\u0dad\u0dd2\u0dc2 \u0d9a\u0dad\u0dcf\u0dc0 \u0db8\u0d9c\u0db4\u0dd9\u0db1\u0dca\u0dc0\u0dd3\u0db8\u0d9a\u0dca \u0dc0\u0dd2\u0dad\u0dbb\u0dba\u0dd2. \u0da2\u0dd3\u0dc0\u0dd2\u0dad\u0dda \u0dc3\u0dd2\u0dba\u0dbd\u0dca\u0dbd \u0db8\u0dda\u0d9a\u0dd9\u0db1\u0dca\u0db8 \u0dad\u0dd3\u0dbb\u0dab\u0dba \u0dc0\u0dd9\u0db1\u0dca\u0db1\u0dda \u0db1\u0dd0\u0dc4\u0dd0. \u0dbb\u0ddd\u0d9c, \u0db1\u0dd3\u0dad\u0dd2, \u0dc3\u0dbd\u0dca\u0dbd\u0dd2 \u0d9c\u0dd0\u0db1 \u0dc0\u0ddb\u0daf\u0dca\u200d\u0dba\u0dc0\u0dbb\u0dba\u0dd9\u0d9a\u0dca, \u0db1\u0dd3\u0dad\u0dd2\u0da5\u0dba\u0dd9\u0d9a\u0dca, \u0db8\u0dd6\u0dbd\u0dca\u200d\u0dba \u0d8b\u0db4\u0daf\u0dda\u0dc1\u0d9a\u0dba\u0dd9\u0d9a\u0dca \u0d85\u0daf\u0dc4\u0dc3\u0dca \u0d85\u0dc4\u0db1\u0dca\u0db1.',
};

function planet(input: NarrativeInput, englishName: string) {
  const si = planetToSi(englishName);
  return input.chart.planets.find((p) => p.name === englishName || p.name === si);
}

function siSections(input: NarrativeInput): NarrativeSection[] {
  const lagna = signToSi(input.chart.lagna.sign);
  const sunSign = signToSi(planet(input, 'Sun')?.sign ?? input.chart.lagna.sign);
  const moonSign = signToSi(planet(input, 'Moon')?.sign ?? input.chart.lagna.sign);
  const jupSign = signToSi(planet(input, 'Jupiter')?.sign ?? 'Taurus');
  const satSign = signToSi(planet(input, 'Saturn')?.sign ?? 'Cancer');
  const soft = input.unknownBirthTime ? SI.softUnknown : SI.softKnown;
  const name = input.fullName;

  const bodies = [
    `${name}, \u0d94\u0db6\u0d9c\u0dda \u0d9a\u0dda\u0db1\u0dca\u0daf\u0dbb\u0dda\u0da7 \u0d85\u0db1\u0dd4\u0dc0 \u0dbd\u0d9c\u0dca\u0db1\u0dba ${lagna}. \u0dc3\u0dd6\u0dbb\u0dca\u0dba\u0dba\u0dcf ${sunSign} \u0dbb\u0dcf\u0dc1\u0dd2\u0dba\u0dda\u0dba\u0dd2, \u0da0\u0db1\u0dca\u0daf\u0dca\u200d\u0dbb\u0dba\u0dcf ${moonSign} \u0dbb\u0dcf\u0dc1\u0dd2\u0dba\u0dda\u0dba\u0dd2. \u0db8\u0dda \u0dc3\u0d82\u0dba\u0ddd\u0d9c\u0dba \u0db6\u0dbd\u0dbd\u0dcf \u0dba\u0ddd\u0d9c \u0db4\u0dbd\u0dcf\u0db4\u0dbd \u0d9a\u0dd2\u0dba\u0db1\u0dca\u0db1\u0db8\u0dca. \u0db0\u0db1\u0dba, \u0dbb\u0dd0\u0d9a\u0dd2\u0dba\u0dcf\u0dc0, \u0d89\u0d9c\u0dd9\u0db1\u0dd3\u0db8 \u0dc0\u0d9c\u0dda \u0daf\u0dda\u0dc0\u0dbd\u0dca\u0dc0\u0dbd\u0da7 \u0db8\u0dda \u0dba\u0ddd\u0d9c \u0d8b\u0daf\u0dc0\u0dca \u0dc0\u0dd9\u0db1 \u0dc0\u0dd2\u0daf\u0dd2\u0dc4 \u0dc3\u0dbb\u0dbd\u0dc0 \u0d9a\u0dd2\u0dba\u0db1\u0dc0\u0dcf. ${soft}\n\n\u0d94\u0db6\u0da7 \u0dad\u0dd2\u0dba\u0dd9\u0db1 \u0dc1\u0d9a\u0dca\u0dad\u0dd2\u0dba \u0db7\u0dcf\u0dc0\u0dd2\u0dad\u0dcf \u0d9a\u0dbb\u0dbd\u0dcf \u0d89\u0daf\u0dd2\u0dbb\u0dd2\u0dba\u0da7 \u0dba\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca. \u0d91\u0dad\u0dca \u0d89\u0d9a\u0dca\u0db8\u0db1\u0dca \u0db6\u0dbd\u0dcf\u0db4\u0ddc\u0dbb\u0ddc\u0dad\u0dca\u0dad\u0dd4 \u0db1\u0dd0\u0dad\u0dd4\u0dc0, \u0d89\u0dc0\u0dc3\u0dd3\u0db8\u0dd9\u0db1\u0dca \u0dc0\u0dd0\u0da9 \u0d9a\u0dbb\u0db1\u0dca\u0db1. \u0d91\u0dc4\u0dd9\u0db8 \u0db1\u0db8\u0dca \u0dc3\u0dca\u0dae\u0dd2\u0dbb \u0daf\u0dd2\u0dba\u0dd4\u0dab\u0dd4\u0dc0\u0d9a\u0dca \u0d91\u0db1\u0dc0\u0dcf.`,
    `\u0dc0\u0dc3\u0dca\u0dad\u0dd4\u0dc0, \u0d89\u0da9\u0db8\u0dca, \u0daf\u0dda\u0db4\u0dbd, \u0db1\u0dd2\u0dc0\u0dc3 \u0dc4\u0daf\u0db1 \u0d91\u0d9a \u0d9c\u0dd0\u0db1 \u0d9a\u0dad\u0dcf \u0d9a\u0dbb\u0db8\u0dd4. \u0db6\u0dca\u200d\u0dbb\u0dc4\u0dc3\u0dca\u0db4\u0dad\u0dd2 ${jupSign} \u0dbb\u0dcf\u0dc1\u0dd2\u0dba\u0dda \u0dad\u0dd2\u0dba\u0dd9\u0db1 \u0db1\u0dd2\u0dc3\u0dcf \u0daf\u0dda\u0db4\u0dbd \u0db4\u0dd0\u0dad\u0dca\u0dad\u0dd9\u0db1\u0dca \u0d86\u0dc1\u0dd3\u0dbb\u0dca\u0dc0\u0dcf\u0daf\u0dba\u0d9a\u0dca \u0dad\u0dd2\u0dba\u0dd9\u0db1\u0dc0\u0dcf. \u0daf\u0dd9\u0dc0\u0db1, \u0dc3\u0dad\u0dbb\u0dc0\u0db1, \u0d91\u0d9a\u0ddc\u0dc5\u0ddc\u0dc3\u0dca\u0dc0\u0db1 \u0db7\u0dcf\u0dc0 \u0db4\u0dd0\u0dad\u0dca\u0dad \u0db6\u0dbd\u0dbd\u0dcf \u0dc3\u0dd4\u0db6 \u0d9a\u0dcf\u0dbd \u0dad\u0ddd\u0dbb\u0d9c\u0db1\u0dca\u0db1.\n\n\u0db8\u0dda \u0d9a\u0dcf\u0dbd\u0dda \u0d89\u0d9a\u0dca\u0db8\u0db1\u0dca \u0dab\u0dba \u0d85\u0dbb\u0d9c\u0dd9\u0db1 \u0d89\u0da9\u0db8\u0dca \u0d9c\u0db1\u0dca\u0db1 \u0d91\u0d9a \u0d91\u0db4\u0dcf. \u0dc4\u0ddc\u0da9\u0dd2\u0db1\u0dca \u0dc3\u0dbd\u0dca\u0dbd\u0dd2 \u0dc3\u0dd0\u0dbd\u0dc3\u0dd4\u0db8\u0dca \u0d9a\u0dbb\u0dbd\u0dcf, \u0db4\u0dc3\u0dca\u0dc3\u0dda \u0db4\u0dd2\u0dba\u0dc0\u0dbb \u0dad\u0dd2\u0dba\u0db1\u0dca\u0db1. \u0d91\u0dc4\u0dd9\u0db8 \u0db1\u0db8\u0dca \u0d94\u0db6\u0da7 \u0dc4\u0ddc\u0da9 \u0daf\u0dd2\u0dba\u0dd4\u0dab\u0dd4\u0dc0\u0d9a\u0dca \u0dbd\u0db6\u0dcf\u0d9c\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca.`,
    `\u0d89\u0d9c\u0dd9\u0db1\u0dd3\u0db8, \u0db8\u0db1\u0dc3, \u0db6\u0dd4\u0daf\u0dca\u0db0\u0dd2\u0dba \u0d9c\u0dd0\u0db1 \u0d9a\u0dd2\u0dba\u0db1\u0dc0\u0dcf \u0db1\u0db8\u0dca \u0da0\u0db1\u0dca\u0daf\u0dca\u200d\u0dbb\u0dba\u0dcf \u0dc3\u0dc4 \u0db6\u0dd4\u0db0\u0d9c\u0dda \u0db6\u0dbd\u0db4\u0dd1\u0db8 \u0dc0\u0dd0\u0daf\u0d9c\u0dad\u0dca. \u0d9a\u0dd9\u0da7\u0dd2 \u0dc0\u0dd9\u0dbd\u0dcf\u0dc0\u0da7 \u0dc4\u0ddc\u0da9\u0da7 \u0d85\u0dc0\u0db0\u0dcf\u0db1\u0dba \u0dba\u0ddd\u0db8\u0dd4 \u0d9a\u0dbb\u0dbd\u0dcf \u0d89\u0d9c\u0dd9\u0db1 \u0d9c\u0db1\u0dca\u0db1 \u0d94\u0db6\u0da7 \u0dbd\u0dda\u0dc3\u0dd2\u0dba\u0dd2.\n\n\u0daf\u0dd2\u0db1\u0db4\u0dad\u0dcf \u0da7\u0dd2\u0d9a \u0dc0\u0dd9\u0dbd\u0dcf\u0dc0\u0d9a\u0dca \u0dc4\u0dbb\u0dd2 \u0db4\u0ddc\u0dad\u0d9a\u0dca \u0d9a\u0dd2\u0dba\u0dc0\u0db1 \u0d91\u0d9a, \u0db1\u0dd0\u0dad\u0dca\u0db1\u0db8\u0dca \u0d85\u0dbd\u0dd4\u0dad\u0dca \u0daf\u0dd9\u0dba\u0d9a\u0dca \u0d89\u0d9c\u0dd9\u0db1 \u0d9c\u0db1\u0dca\u0db1 \u0d91\u0d9a \u0dc4\u0ddc\u0da9\u0dba\u0dd2. \u0db8\u0db1\u0dc3 \u0dc0\u0dd9\u0dc4\u0dd9\u0dc3\u0dd9\u0db1\u0d9a\u0ddc\u0da7 \u0da7\u0dd2\u0d9a\u0d9a\u0dca \u0dc0\u0dd2\u0dc0\u0dda\u0d9a \u0d9c\u0db1\u0dca\u0db1\u0dad\u0dca \u0d85\u0db8\u0dad\u0d9a \u0d9a\u0dbb\u0db1\u0dca\u0db1 \u0d91\u0db4\u0dcf.`,
    `\u0dbb\u0dd0\u0d9a\u0dd2\u0dba\u0dcf\u0dc0\u0da7 \u0d9c\u0dd0\u0dbd\u0db4\u0dd9\u0db1 \u0db4\u0dd0\u0dad\u0dca\u0dad \u0dad\u0db8\u0dba\u0dd2 \u0dc3\u0db1\u0dca\u0db1\u0dd2\u0dc0\u0dda\u0daf\u0db1\u0dba \u0dc3\u0dc4 \u0d85\u0db1\u0dd4\u0db1\u0dca\u0da7 \u0d8b\u0daf\u0dc0\u0dca \u0dc0\u0dd9\u0db1 \u0dc0\u0dd0\u0da9. \u0dbd\u0d9c\u0dca\u0db1\u0dba ${lagna} \u0db1\u0dd2\u0dc3\u0dcf \u0d89\u0d9c\u0dd0\u0db1\u0dca\u0dc0\u0dd3\u0db8, \u0d8b\u0db4\u0daf\u0dd9\u0dc3\u0dca \u0daf\u0dd3\u0db8, \u0dc0\u0dd2\u0d9a\u0dd4\u0dab\u0dd4\u0db8\u0dca, \u0dc3\u0dda\u0dc0\u0dcf \u0dc0\u0dd0\u0da9 \u0dc0\u0d9c\u0dda \u0daf\u0dda\u0dc0\u0dbd\u0dca \u0dc4\u0ddc\u0da9\u0da7 \u0d9c\u0dd0\u0dbd\u0db4\u0dd9\u0db1\u0dc0\u0dcf.\n\n\u0d8b\u0dc3\u0dc3\u0dca\u0dc0\u0dd3\u0db8\u0dca \u0d9c\u0db1\u0dca\u0db1 \u0d95\u0db1 \u0db1\u0db8\u0dca \u0dc4\u0ddc\u0da9\u0dd2\u0db1\u0dca \u0d9a\u0dad\u0dcf \u0d9a\u0dbb\u0dbd\u0dcf, \u0d94\u0db6\u0dda \u0dc0\u0dd0\u0da9 \u0db4\u0dda\u0db1\u0dca\u0db1 \u0dad\u0dd2\u0dba\u0db1\u0dca\u0db1. \u0d91\u0d9a\u0db4\u0dcf\u0dbb\u0da7 \u0dc0\u0dd2\u0dc1\u0dcf\u0dbd \u0dc0\u0dd9\u0db1\u0dc3\u0dca\u0d9a\u0db8\u0dca \u0db1\u0ddc\u0d9a\u0dbb, \u0db4\u0dd2\u0dba\u0dc0\u0dbb\u0dd9\u0db1\u0dca \u0db4\u0dd2\u0dba\u0dc0\u0dbb \u0d89\u0daf\u0dd2\u0dbb\u0dd2\u0dba\u0da7 \u0dba\u0db1\u0dca\u0db1.`,
    `\u0dc0\u0dca\u200d\u0dba\u0dcf\u0db4\u0dcf\u0dbb\u0dba\u0d9a\u0dd2\u0db1\u0dca \u0daf\u0dd2\u0dba\u0dd4\u0dab\u0dd4 \u0dc0\u0dd9\u0db1\u0dca\u0db1 \u0d95\u0db1 \u0db1\u0db8\u0dca \u0d94\u0db6\u0da7 \u0d9c\u0dd0\u0dbd\u0db4\u0dd9\u0db1\u0dca\u0db1\u0dda \u0dc3\u0dda\u0dc0\u0dcf\u0dc0\u0d9a\u0dca \u0dc4\u0ddd \u0daf\u0dd9\u0dba\u0d9a\u0dca \u0dc0\u0dd2\u0d9a\u0dd4\u0dab\u0dd4\u0db1 \u0dc0\u0dd0\u0da9. \u0d85\u0dbd\u0dd4\u0dad\u0dd9\u0db1\u0dca \u0db4\u0da7\u0db1\u0dca \u0d9c\u0db1\u0dca\u0db1 \u0d9a\u0dbd\u0dd2\u0db1\u0dca \u0dc3\u0dbd\u0dca\u0dbd\u0dd2 \u0d91\u0db1 \u0dc0\u0dd2\u0daf\u0dd2\u0dc4 \u0dc3\u0dc4 \u0dba\u0db1 \u0dc0\u0dd2\u0daf\u0dd2\u0dc4 \u0dc4\u0ddc\u0da9\u0da7 \u0db6\u0dbd\u0db1\u0dca\u0db1.\n\n\u0dc4\u0dc0\u0dd4\u0dbd\u0dca\u0d9a\u0dcf\u0dbb\u0dba\u0dd9\u0d9a\u0dca \u0d91\u0d9a\u0dca\u0d9a \u0dba\u0db1\u0dc0\u0dcf \u0db1\u0db8\u0dca \u0dc0\u0dd2\u0dc1\u0dca\u0dc0\u0dcf\u0dc3\u0dba \u0dad\u0dd2\u0dba\u0dd9\u0db1 \u0d9a\u0dd9\u0db1\u0dd9\u0d9a\u0dca \u0dad\u0ddd\u0dbb\u0d9c\u0db1\u0dca\u0db1. \u0d89\u0d9a\u0dca\u0db8\u0db1\u0dca \u0dbd\u0dcf\u0db7 \u0d91\u0db1\u0dc0\u0dcf \u0d9a\u0dd2\u0dba\u0dbd\u0dcf \u0d85\u0db0\u0dd2\u0d9a \u0d85\u0dc0\u0daf\u0dcf\u0db1\u0db8\u0dca \u0d9c\u0db1\u0dca\u0db1 \u0d91\u0db4\u0dcf.`,
    `\u0d86\u0daf\u0dcf\u0dba\u0db8\u0dca \u0d91\u0db1 \u0db4\u0dd0\u0dad\u0dca\u0dad \u0dc4\u0ddc\u0da9\u0da7 \u0dad\u0dd2\u0dba\u0dd9\u0db1\u0dc0\u0dcf, \u0d91\u0dad\u0dca \u0dc0\u0dd2\u0dba\u0daf\u0db8\u0dca \u0db4\u0dcf\u0dbd\u0db1\u0dba \u0d9a\u0dbb\u0d9c\u0db1\u0dca\u0db1 \u0d95\u0db1\u0dda. \u0d85\u0db1\u0dc0\u0dc1\u0dca\u200d\u0dba \u0daf\u0dda\u0dc0\u0dbd\u0dca\u0da7 \u0dc3\u0dbd\u0dca\u0dbd\u0dd2 \u0dba\u0db1 \u0d91\u0d9a \u0d85\u0da9\u0dd4 \u0d9a\u0dbb\u0db1\u0dca\u0db1.\n\n\u0db8\u0dcf\u0dc3\u0dd9\u0d9a\u0da7 \u0d9a\u0ddc\u0da0\u0dca\u0da0\u0dbb \u0d91\u0db1\u0dc0\u0daf, \u0d9a\u0ddc\u0da0\u0dca\u0da0\u0dbb \u0dba\u0db1\u0dc0\u0daf \u0d9a\u0dd2\u0dba\u0dbd\u0dcf \u0da7\u0dd2\u0d9a\u0d9a\u0dca \u0dbd\u0dd2\u0dba\u0dbd\u0dcf \u0dad\u0dd2\u0dba\u0dcf\u0d9c\u0db1\u0dca\u0db1. \u0d91\u0dad\u0d9a\u0ddc\u0da7 \u0db4\u0dcf\u0da9\u0dd4 \u0d85\u0da9\u0dd4 \u0dc0\u0dd9\u0dbd\u0dcf \u0d89\u0dad\u0dd4\u0dbb\u0dd4 \u0d9a\u0dbb\u0d9c\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca.`,
    `\u0d9a\u0dd9\u0da7\u0dd2 \u0d9a\u0dcf\u0dbd\u0dba\u0da7 \u0d9c\u0ddd\u0da0\u0dbb \u0db4\u0dbd \u0d9c\u0dd0\u0db1 \u0d9a\u0dad\u0dcf \u0d9a\u0dbb\u0db8\u0dd4. \u0dc3\u0dd6\u0dbb\u0dca\u0dba\u0dba\u0dcf, \u0db6\u0dca\u200d\u0dbb\u0dc4\u0dc3\u0dca\u0db4\u0dad\u0dd2 (${jupSign}), \u0dc3\u0dd9\u0db1\u0dc3\u0dd4\u0dbb\u0dd4 (${satSign}) \u0db6\u0dbd\u0db4\u0dd1\u0db8\u0dca \u0d89\u0daf\u0dd2\u0dbb\u0dd2 \u0db8\u0dcf\u0dc3 \u0daf\u0ddc\u0dc5\u0dc4\u0d9a\u0da7 \u0dc0\u0dd0\u0daf\u0d9c\u0dad\u0dca.\n\n\u0db8\u0dda \u0d9a\u0dcf\u0dbd\u0dda \u0dc0\u0dd0\u0da9, \u0d89\u0d9c\u0dd9\u0db1\u0dd3\u0db8, \u0daf\u0dda\u0db4\u0dbd \u0dad\u0dd3\u0dbb\u0dab \u0da7\u0dd2\u0d9a\u0d9a\u0dca \u0db4\u0dbb\u0dd2\u0dc3\u0dca\u0dc3\u0db8\u0dd2\u0db1\u0dca \u0d9c\u0db1\u0dca\u0db1. \u0dc4\u0daf\u0dd2\u0dc3\u0dca\u0dc3\u0dd2\u0dba\u0dd9\u0db1\u0dca \u0dbd\u0ddc\u0d9a\u0dd4 \u0dab\u0dba \u0d9c\u0db1\u0dca\u0db1 \u0d91\u0d9a \u0d91\u0db4\u0dcf. \u0db8\u0dda\u0d9a \u0db8\u0d9c\u0db4\u0dd9\u0db1\u0dca\u0dc0\u0dd3\u0db8\u0d9a\u0dca \u0dc0\u0dd2\u0dad\u0dbb\u0dba\u0dd2, \u0d85\u0dc0\u0dc3\u0dcf\u0db1 \u0dc0\u0da0\u0db1\u0dba \u0db1\u0dd9\u0dc0\u0dd9\u0dba\u0dd2.`,
    `\u0dc0\u0dc3\u0dbb \u0dc0\u0dd2\u0dc3\u0dd2\u0db4\u0dc4\u0d9a \u0daf\u0ddc\u0dc1\u0dcf \u0d9a\u0dad\u0dcf\u0dc0 \u0dc3\u0dbb\u0dbd\u0dc0 \u0d9a\u0dd2\u0dba\u0db1\u0dc0\u0dcf \u0db1\u0db8\u0dca, \u0d8b\u0db4\u0db1\u0dca \u0daf\u0dd2\u0db1\u0dba ${input.birthDate} \u0dc3\u0dc4 \u0da0\u0db1\u0dca\u0daf\u0dca\u200d\u0dbb\u0dba\u0dcf ${moonSign} \u0dbb\u0dcf\u0dc1\u0dd2\u0dba\u0dda \u0dad\u0dd2\u0dba\u0dd9\u0db1 \u0d91\u0d9a \u0db4\u0daf\u0db1\u0db8\u0dca \u0d9a\u0dbb\u0d9c\u0dd9\u0db1 \u0db8\u0dc4\u0dcf \u0daf\u0ddc\u0dc1\u0dcf \u0d9a\u0dcf\u0dbd \u0db6\u0dd9\u0daf\u0dbd\u0dcf \u0db6\u0dbd\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca.\n\n\u0db4\u0dc5\u0dc0\u0dd9\u0db1\u0dd2 \u0d85\u0dc0\u0dd4\u0dbb\u0dd4\u0daf\u0dd4 \u0d9a\u0dd3\u0db4\u0dba\u0dda\u0daf\u0dd3 \u0d89\u0d9c\u0dd9\u0db1\u0dd3\u0db8 \u0dc3\u0dc4 \u0db4\u0dd4\u0dbb\u0dd4\u0daf\u0dd4 \u0dc4\u0daf\u0dcf\u0d9c\u0db1\u0dca\u0db1. \u0d8a\u0dc5\u0d9f \u0d9a\u0dcf\u0dbd\u0dda \u0dbb\u0dd0\u0d9a\u0dd2\u0dba\u0dcf\u0dc0 \u0dc3\u0dc4 \u0dc3\u0dbd\u0dca\u0dbd\u0dd2 \u0db4\u0dd0\u0dad\u0dca\u0dad \u0dc1\u0d9a\u0dca\u0dad\u0dd2\u0db8\u0dad\u0dca \u0dc0\u0dd9\u0db1\u0dc0\u0dcf. \u0d8a\u0da7 \u0db4\u0dc3\u0dca\u0dc3\u0dda \u0db4\u0dc0\u0dd4\u0dbd, \u0daf\u0dda\u0db4\u0dbd, \u0dc3\u0db8\u0dcf\u0da2 \u0dad\u0dad\u0dca\u0dad\u0dca\u0dc0\u0dba \u0d9c\u0dd0\u0db1 \u0d85\u0dc0\u0dc3\u0dca\u0dae\u0dcf \u0d91\u0db1\u0dc0\u0dcf. \u0d85\u0db1\u0dca\u0dad\u0dd2\u0db8 \u0d9a\u0dcf\u0dbd\u0dda \u0d85\u0dad\u0dca\u0daf\u0dd0\u0d9a\u0dd3\u0db8\u0dca \u0db6\u0dd9\u0daf\u0dcf\u0d9c\u0dd9\u0db1 \u0d85\u0db1\u0dd4\u0db1\u0dca\u0da7\u0dad\u0dca \u0d8b\u0daf\u0dc0\u0dca \u0dc0\u0dd9\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca.\n\n\u0db1\u0dd0\u0d9a\u0dd0\u0dad\u0dca \u0db1\u0dd2\u0dc0\u0dd0\u0dbb\u0daf\u0dd2\u0dc0 \u0db1\u0dd0\u0dad\u0dd2 \u0db1\u0dd2\u0dc3\u0dcf \u0daf\u0dd2\u0db1\u0dba\u0db1\u0dca \u0da7\u0dd2\u0d9a\u0d9a\u0dca \u0dc0\u0dd9\u0db1\u0dc3\u0dca \u0dc0\u0dd9\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca. \u0d92 \u0db1\u0dd2\u0dc3\u0dcf \u0db8\u0dda\u0d9a \u0db8\u0d9c\u0db4\u0dd9\u0db1\u0dca\u0dc0\u0dd3\u0db8\u0d9a\u0dca \u0dc0\u0dd2\u0daf\u0dd2\u0dc4\u0da7 \u0d85\u0dbb\u0d9c\u0db1\u0dca\u0db1.`,
    SI.disclaimer,
  ];

  return reportSectionTitles('si').map((heading, i) => ({
    heading,
    body: bodies[i] ?? SI.disclaimer,
  }));
}

export class LocalNarrativeAdapter implements NarrativeAdapter {
  readonly modelName = 'local-narrative-0.5-si-native';

  async generate(input: NarrativeInput): Promise<NarrativeResult> {
    const lang = String(input.language);
    const localizedInput: NarrativeInput = {
      ...input,
      chart: localizeChart(input.chart, lang),
    };

    const guest = isGuestNarrative(input.productSlug) && !isFullReportNarrative(input);
    let sections: NarrativeSection[];

    if (isFullReportNarrative(input)) {
      const lagna = localizedInput.chart.lagna.sign;
      const name = input.fullName;
      const brand = lang === 'si' ? THARAKA_BRAND_SI : THARAKA_BRAND_EN;
      const year = new Date().getFullYear();
      const salutation = buildSalutation({
        fullName: name,
        gender: input.gender,
        birthDate: input.birthDate,
        language: lang,
      });
      sections = fullReportJsonToSections(
        {
          introduction: `${salutation.openingLine}\n\nආයුබෝවන්!\n\n${brand} (Taraka Astrology Services) වෙතින් ඉදිරිපත් කරනු ලබන ඔබගේ මූලික උපන් සිතියම් වාර්තාව වෙත ඔබව සාදරයෙන් පිළිගනිමු.\n\nසමස්තයක් ලෙස බලන කල, ${salutation.shortForm}ගේ ජන්ම පත්‍රය පරීක්ෂා කිරීමේදී ඉදිරි ජීවිතය පිළිබඳ වැදගත් තොරතුරු අනාවරණය වේ.`,
          basic_info: {
            lagnaya: `ඔබේ ලග්නය ${lagna} වේ. මෙම ලග්නය ජීවන ගමනේ මූලික ස්වභාවය පෙන්වයි.`,
            nakathya: `උපන් නැකත සහ පාදය ඔබේ මනෝභාවයට බලපායි. ගණ සහ යෝනි විස්තර සම්පූර්ණ වාර්තාවේදී වැදගත් වේ.`,
            rashi: `චන්ද්‍ර සහ රවි රාශි ඔබේ අභ්‍යන්තර හැඟීම් සහ බාහිර දිශාව පෙන්වයි.`,
          },
          charitha_lakshana: `ඔබ පරීක්ෂාකාරී සහ සංවේදී ස්වභාවයක් දක්වයි.\n\nශක්තීන්: ඉවසීම, වගකීම.`,
          health: `සමස්ත සෞඛ්‍යය මධ්‍යස්ථ සිට හොඳ මට්ටමක පවතී.\n\nශරීර ශක්තිය රැක ගැනීමට නිතිපතා විවේකය, සරල ආහාර රටාව සහ මානසික සන්සුන්කම වැදගත්ය.`,
          main_weaknesses: `### රුධිර ධාවනය සහ හෘදය ආශ්‍රිත අපහසුතා\nරුධිර පීඩනය / මානසික උද්වේගයන් නිරීක්ෂණය කරන්න.\n\n### උදරගත සහ ආහාර ජීර්ණ උෂ්ණාධික රෝග\nආහාර ජීර්ණ පද්ධතියේ දුර්වලතා සහ හිසරදය මතුවිය හැක.\n\n### ස්නායු පද්ධතියේ වෙහෙස\nකාර්යබහුල ජීවන රටාව නිසා මානසික වෙහෙස සහ නින්දේ අපහසුතා පාලනය කරගත යුතුය.`,
          health_remedies: `1. මුණිකේ වර්ග පැළඳීම: සුදුසුකම් ලත් ජ්‍යෝතිෂවේදියකුගේ උපදෙස් මත පමණක් මැණික් තෝරන්න.\n2. ආගමික වතාවත් සහ බෝධිපූජා: අදාළ ග්‍රහ දෝෂ ප්‍රශමනයට දානය සහ පූජා.\n3. ජීවන රටාව: භාවනා/යෝග, උෂ්ණ අධික ආහාර සීමා කිරීම, පිරිසිදු ජලය.\n\n(මෙය වෛද්‍ය උපදෙසක් නොවේ — සංස්කෘතික/ආධ්‍යාත්මික මඟ පෙන්වීමකි.)`,
          darupala: `පවුල් ජීවිතයේ ස්ථාවරත්වය කාලයත් සමඟ වර්ධනය වේ.\n\nදරු සම්පත් සඳහා ශුභ කාල තෝරා ගැනීම වැදගත්ය.`,
          jiwitha_kalayata_wishesha_anawaki: `- තරුණ වයස: ඉගෙනීමට අවධානය\n- මධ්‍යම වයස: රැකියා/ව්‍යාපාර දියුණුව\n- පසු කාලය: ස්ථිරත්වය සහ උපදෙස්`,
          wiwahaya_ha_adala_shuba_kalayan: `විවාහ ජීවිතයේ සාර්ථකත්වය විශ්වාසය සහ කතාබහ මත රඳා පවතී.\n\nශුභ කාල තෝරා ගැනීමෙන් ප්‍රමාද අවදානම අඩු කරන්න.`,
          yoga_phinitim: `### ලග්න යෝග\n${lagna} ලග්නය මත පදනම් වූ ග්‍රහ සංයෝග ඔබේ ජීවන ගමනට විශේෂ බලපෑම් ඇති කරයි.\n\n### බුධ ආදිත්‍ය යෝග (Budha Adithya)\nබුද්ධිමත් තීරණ සහ සන්නිවේදන ශක්තිය වර්ධනය වේ.\n\n### ශත්‍රු හන්ත යෝග (Sathyru Hantha)\nඅභියෝග මැඩපැවැත්වීමේ හැකියාව ඉහළ යයි; කෙසේ වෙතත් ඉවසීම අත්‍යවශ්‍යයි.`,
          education_mind: `උසස් අධ්‍යාපනයට හැකියාව ඇත.\n\n- මතක ශක්තිය සහ අවධානය වර්ධනය කිරීමට නිතිපතා කියවීම\n- මානසික සමතුලිතතාව සඳහා විවේක හා භාවනා\n- එක මාර්ගයකට කැපවීමෙන් බුද්ධි මට්ටම දියුණු වේ`,
          business_growth_times: `ව්‍යාපාර ක්ෂේත්‍රවල සාර්ථකත්වය ක්‍රමානුකූල සැලසුම් මත රඳා පවතී.\n\n- අධ්‍යාපන / සේවා / අපනයන අදාළ ක්ෂේත්‍ර සලකා බලන්න\n- හවුල්කාරිත්වයේදී ලිඛිත ගිවිසුම් අනිවාර්ය කරන්න\n- ශුභ කාලවලදී නව ආරම්භයන් සලකා බලන්න`,
          wealth_property_times: `ඉඩකඩම් සහ නිවාස සඳහා උරුමකම් කාලයන් පැමිණේ.\n\n- දෙවන සහ එකොළොස්වන භාව ශක්තිය ධන වර්ධනයට උපකාරීයි\n- නිවාස ඉදිකිරීම / මිලදී ගැනීම සඳහා ශුභ මාස තෝරන්න\n- ඉක්මන් ණය තීරණවලින් වළකින්න`,
          career_promotions: `රැකියා නියුක්තිය සහ උසස්වීම් සඳහා ස්වර්ණමය කාල ඇත.\n\n- පරිපාලනය, බැංකු, අධ්‍යාපනය, මැණික් ක්ෂේත්‍ර සුදුසුයි\n- කාර්යාල ඉවසීම සහ නිපුණතා වර්ධනය උසස්වීම්වලට මග පාදයි\n- දසවන භාව ශක්තිමත් කාලවලදී අවස්ථා සොයන්න`,
          income_expenses: `ධනලාභ මාර්ග කිහිපයක් ඇත.\n\n- මාසික අයවැයක් පවත්වා ගන්න\n- සමාකලන / පිරමීඩ් ආයෝජන වලින් වළකින්න\n- ඉක්මන් ණය ගැනීමෙන් වළකින්න\n- දිගුකාලීන ඉතුරුම් මගින් පාඩු අවදානම අඩු කරන්න`,
          gochara_report: `### සූර්ය ගෝචරය\nඉදිරි මාස 12 තුළ සූර්යයාගේ ගෝචරය කෙටිකාලීන ශක්තිය සහ තීරණ වලට බලපායි.\n\n### බ්‍රහස්පති ගෝචරය\nගුරු ගෝචරය අධ්‍යාපනය, ධනය සහ ආශීර්වාද කාල පෙන්වයි.\n\n### සෙනසුරු ගෝචරය\nසෙනසුරු ගෝචරය වගකීම්, ප්‍රමාද සහ දීර්ඝ කාලීන විනය අවධාරණය කරයි.\n\n- මුල් කාර්තුව: පරිස්සම් සහ සැලසුම්\n- මැද කාර්තු: අවස්ථා ග්‍රහණය\n- අවසන් කාර්තු: ප්‍රතිඵල තහවුරු කිරීම`,
          dasa_timeline: [
            {
              period: `${year} - ${year + 4}`,
              dasa_lord: 'වත්මන් මහා දශාව / අන්තර් දශා',
              prediction: `මෙම කාලයේ ඉගෙනීම සහ රැකියා පදනම ශක්තිමත් වේ.\n\n- නව තීරණ ගැනීමට පෙර උපදෙස් ලබා ගන්න\n- දානය සහ නිතිපතා භාවනාවෙන් මනස සන්සුන් කරන්න`,
            },
            {
              period: `${year + 4} - ${year + 10}`,
              dasa_lord: 'ඊළඟ මහා දශා කාලය',
              prediction: `දියුණුවේ වේගය වැඩි විය හැක.\n\n- දේපල සහ ව්‍යාපාර අවස්ථා සලකා බලන්න\n- හවුල්කාරිත්වයේදී පැහැදිලි ගිවිසුම් තබා ගන්න`,
            },
            {
              period: `${year + 10} - ${year + 18}`,
              dasa_lord: 'මධ්‍යම කාල මහා දශාව',
              prediction: `වගකීම් සහ නායකත්ව අවස්ථා වැඩි වේ.\n\n- සෞඛ්‍යය සහ පවුල් සමතුලිතතාව රැක ගන්න\n- දිගුකාලීන ඉතුරුම් සැලසුම් කරන්න`,
            },
            {
              period: `${year + 18} - ${year + 25}`,
              dasa_lord: 'පසු කාල මහා දශාව',
              prediction: `ස්ථාවරත්වය සහ උපදේශන භූමිකාවන් ඉස්මතු වේ.\n\n- ධන සම්පත් ආරක්ෂා කරන්න\n- ආධ්‍යාත්මික කටයුතුවලට වැඩි කාලයක් වෙන් කරන්න`,
            },
          ],
          conclusion: `${brand} වෙනුවෙන් ඔබට දීර්ඝායුෂ, නිරෝගී සුවය සහ සියලු යහපත් ප්‍රාර්ථනාවන් සාර්ථක වේවායි පතමු!\n\nකර්මය, නිදහස් කැමැත්ත සහ පුද්ගලික උත්සාහය අනාගතයට බලපායි.`,
        },
        lang === 'si' ? 'si' : lang,
      );
    } else if (guest) {
      const titles = guestSectionTitles(lang);
      const lagna = localizedInput.chart.lagna.sign;
      const lagnaDeg = Math.round(localizedInput.chart.lagna.degree * 10) / 10;
      const name = input.fullName;
      const soft =
        input.unknownBirthTime && lang === 'si'
          ? ' උපන් වේලාව නිශ්චිත නැති නිසා කාලය මෘදුව කියවන්න.'
          : input.unknownBirthTime
            ? ' Birth time is approximate, so timing is softened.'
            : '';

      const freeSi = [
        `${name}, ඔබේ ලග්නය ${lagna} (${lagnaDeg}°) අනුව ජීවන ගමනේ දිගුකාලීන දිශාව පැහැදිලිය. ප්‍රධාන අභියෝගය ඉක්මන් තීරණයි; පිළියම: ඉවසීමෙන් සහ පියවරෙන් පියවර සැලසුම් කරන්න.${soft}`,
        `${name}, විවාහය/පෞද්ගලික ජීවිතයේදී ${lagna} ලග්නය සම්බන්ධතාවලට බලපායි. ප්‍රමාදය හෝ වැරදි තේරීම් අවදානමකි; පිළියම: විශ්වාසය ගොඩනගා කතා කරන්න, ඉක්මන් බැඳීම් මගහරින්න.`,
        `${name}, අධ්‍යාපනය සහ වෘත්තීය මාර්ගය ${lagna} ලග්නයට ගැලපෙන ක්ෂේත්‍රවල දියුණු වේ. බාධාව: අවධානය විසිරීම; පිළියම: එක මාර්ගයකට කැපවී ඉගෙනීම/වැඩ කරන්න.`,
        `${name}, සෞඛ්‍යයේදී මනස සහ ශරීර තෙහෙට්ටුව නිරීක්ෂණය කරන්න. බාධාව: නිදාගැනීම/ආහාර රටාව; පිළියම: නිතිපතා විවේකය සහ සරල දෛනික රුටීනයක්.`,
        `${name}, ජීවිත බාධා මූලිකවම කාලය සහ තීරණවලින් එනවා. පිළියම්: දානය, ගුරු/වැඩිහිටි උපදෙස්, සහ නිතිපතා භාවනා/යාඥාවකින් මනස සන්සුන් කරන්න.`,
      ];
      const freeEn = [
        `${name}, with Lagna ${lagna} at ${lagnaDeg}°, your life path has a clear long-term direction. Main struggle: rushed choices; remedy: plan in small steady steps.${soft}`,
        `${name}, marriage and personal bonds are shaped by ${lagna} Lagna. Risk of delay or mismatched timing; remedy: build trust through honest talk and avoid hasty commitments.`,
        `${name}, education and career grow in fields that suit ${lagna} Lagna. Obstacle: scattered focus; remedy: commit to one path and skill-build consistently.`,
        `${name}, for health watch mind–body fatigue. Struggle: sleep/food rhythm; remedy: simple daily routine and regular rest.`,
        `${name}, life obstacles often come from timing and decisions. Remedies: charity, elder guidance, and a steady calming practice (prayer/meditation).`,
      ];
      const lockedSi =
        'ඊළඟ ඡේදයේ නිවැරදි කාලසීමා, භාව/ග්‍රහ සටහන් සහ විස්තරාත්මක පිළියම් ඇත. සම්පූර්ණ වාර්තාවෙන් කියවන්න.';
      const lockedEn =
        'The next paragraph covers timing windows, house notes, and fuller remedies. Unlock the complete report to read them.';

      sections = titles.map((heading, i) => ({
        heading,
        body: `${(lang === 'si' ? freeSi : freeEn)[i] ?? freeEn[0]}\n\n${lang === 'si' ? lockedSi : lockedEn}`,
      }));
    } else if (lang === 'si') {
      sections = siSections(localizedInput);
    } else {
      sections = reportSectionTitles(lang).map((heading) => ({
        heading,
        body: `${input.fullName}, Lagna ${localizedInput.chart.lagna.sign}. Practical guidance from your chart for this topic.`,
      }));
    }

    const title = `${input.productName} — ${input.fullName}`;
    return {
      title,
      sections,
      plainText: sectionsToPlainText(title, sections),
      aiModel: this.modelName,
    };
  }
}
