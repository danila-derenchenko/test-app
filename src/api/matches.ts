import mockData from '../../data/mock-matches.json';
import { MATCHES_URL } from '../config';

export type Match = {
  id: string;
  startsAt: string | null;
  status: string;
  home: string;
  away: string;
  minute?: number;
  score: { home: number; away: number } | null;
};

export type MatchesResponse = { round: number; matches: Match[] };
export type LoadedMatches = MatchesResponse & { source: 'mock' | 'server' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function teamName(value: unknown): string {
  const name = isRecord(value) ? value.name : value;
  if (typeof name !== 'string' || !name.trim()) throw new Error('Некорректное название команды.');
  return name;
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function parseMatches(value: unknown): MatchesResponse {
  if (!isRecord(value) || !isScore(value.round) || !Array.isArray(value.matches)) {
    throw new Error('Некорректный ответ сервера.');
  }
  const matches = value.matches.map((item): Match => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id ||
        typeof item.status !== 'string' ||
        (item.startsAt !== null && (typeof item.startsAt !== 'string' || !Number.isFinite(Date.parse(item.startsAt)))) ||
        (item.minute !== undefined && !isScore(item.minute))) {
      throw new Error('Некорректные данные матча.');
    }
    let score: Match['score'] = null;
    if (item.score !== null) {
      if (!isRecord(item.score) || !isScore(item.score.home) || !isScore(item.score.away)) {
        throw new Error('Некорректный счёт матча.');
      }
      score = { home: item.score.home, away: item.score.away };
    }
    return {
      id: item.id, startsAt: item.startsAt, status: item.status,
      home: teamName(item.home), away: teamName(item.away), score,
      minute: item.minute,
    };
  });
  if (new Set(matches.map((match) => match.id)).size !== matches.length) {
    throw new Error('Повторяющиеся идентификаторы матчей.');
  }
  return { round: value.round, matches };
}

export async function loadMatches(signal: AbortSignal): Promise<LoadedMatches> {
  const response = await fetch(MATCHES_URL, { signal, cache: 'no-store' });
  // Моки заменяют только отсутствующий ресурс, а не сетевые ошибки и сбои сервера.
  if (response.status === 404) return { ...parseMatches(mockData), source: 'mock' };
  if (!response.ok) throw new Error(`Сервер вернул ошибку HTTP ${response.status}.`);
  const json: unknown = await response.json();
  return { ...parseMatches(json), source: 'server' };
}
