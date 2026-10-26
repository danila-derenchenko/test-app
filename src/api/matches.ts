import mockData from '../../data/mock-matches.json';

export type Match = {
  id: string;
  startsAt: string | null;
  status: string;
  home: string;
  away: string;
  score: { home: number; away: number } | null;
};

export type MatchesResponse = {
  round: number;
  matches: Match[];
};

// Пока API недоступен, имитируем асинхронную загрузку локальных данных.
export async function loadMatches(): Promise<MatchesResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockData;
}
