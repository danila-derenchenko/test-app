import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMatches, type LoadedMatches } from '../api/matches';

export function useMatches() {
  const [data, setData] = useState<LoadedMatches | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    try {
      const result = await loadMatches(controller.signal);
      if (request.current !== controller) return;
      setData(result);
      setUpdatedAt(new Date());
    } catch (cause) {
      if (request.current !== controller) return;
      setError(timedOut ? 'Сервер не ответил за 15 секунд. Попробуйте ещё раз.' :
        cause instanceof Error && /^(Сервер|Некоррект|Повторяющиеся)/.test(cause.message)
          ? cause.message : 'Не удалось загрузить матчи. Проверьте подключение к интернету.');
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setData(null);
    setUpdatedAt(null);
    void refresh();
    return () => {
      const controller = request.current;
      request.current = null;
      controller?.abort();
    };
  }, [refresh]);

  return { data, loading, error, updatedAt, refresh };
}
