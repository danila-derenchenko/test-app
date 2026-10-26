import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadMatches, type MatchesResponse } from '../api/matches';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';

type MatchFilter = 'all' | 'upcoming' | 'finished';

const filters: { value: MatchFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
];

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
  const [filter, setFilter] = useState<MatchFilter>('all');
  const { favorites, isFavorite, toggle } = useFavorites();

  const matches = data?.matches.filter((match) => {
    if (filter === 'all') return true;
    // Перенесённые матчи ещё предстоят. Идущие и неизвестные статусы видны в «Все».
    if (filter === 'upcoming') return match.status === 'scheduled' || match.status === 'postponed';
    return match.status === 'finished';
  }) ?? [];

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
      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Статус матча">
        {filters.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            aria-checked={filter === item.value}
            onPress={() => setFilter(item.value)}
            style={({ pressed }) => [
              styles.filter,
              filter === item.value && styles.selectedFilter,
              pressed && styles.pressedFilter,
            ]}
          >
            <Text style={[styles.filterText, filter === item.value && styles.selectedFilterText]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {data ? (
        <FlatList
          data={matches}
          extraData={favorites}
          keyExtractor={(match) => match.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.subtitle}>В этой категории пока нет матчей.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.status}>{statusLabels[item.status] ?? 'Статус уточняется'}</Text>
                <FavoriteButton active={isFavorite(item.id)} onPress={() => toggle(item.id)} />
              </View>
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
  selectedFilter: { backgroundColor: '#333', borderColor: '#333' },
  pressedFilter: { opacity: 0.7 },
  filterText: { fontSize: 13, color: '#333' },
  selectedFilterText: { color: '#fff' },
  card: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  status: { color: '#666', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  team: { flex: 1, fontSize: 17, color: '#222' },
  score: { fontSize: 18, fontWeight: '600', color: '#222' },
  date: { fontSize: 12, color: '#777', marginTop: 8 },
  loading: { alignItems: 'center', paddingTop: 32 },
});
