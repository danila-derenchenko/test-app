import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { loadMatches, type MatchesResponse } from '../api/matches';

const statusLabels: Record<string, string> = {
  scheduled: 'Предстоит',
  live: 'Идёт матч',
  finished: 'Завершён',
  postponed: 'Перенесён',
};

function formatDate(value: string | null): string {
  if (!value) return 'Дата и время уточняются';
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchesScreen() {
  const [data, setData] = useState<MatchesResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadMatches().then((result) => {
      if (!cancelled) setData(result);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      <Text style={styles.subtitle}>
        {data ? `Тур ${data.round} · ` : ''}Демонстрационные данные
      </Text>
      {data ? (
        <FlatList
          data={data.matches}
          keyExtractor={(match) => match.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.status}>{statusLabels[item.status] ?? 'Статус уточняется'}</Text>
              <View style={styles.row}>
                <Text style={styles.team}>{item.home}</Text>
                <Text style={styles.score}>{item.score?.home ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.team}>{item.away}</Text>
                <Text style={styles.score}>{item.score?.away ?? '—'}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.startsAt)}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color="#666" />
          <Text style={styles.subtitle}>Загрузка матчей…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 13, color: '#777', marginTop: 8, marginBottom: 16 },
  list: { paddingBottom: 24 },
  card: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
  status: { color: '#666', fontSize: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  team: { flex: 1, fontSize: 17, color: '#222' },
  score: { fontSize: 18, fontWeight: '600', color: '#222' },
  date: { fontSize: 12, color: '#777', marginTop: 8 },
  loading: { alignItems: 'center', paddingTop: 32 },
});
