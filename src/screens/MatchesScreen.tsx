import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FavoriteButton } from '../components/FavoriteButton';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { useFavorites } from '../hooks/useFavorites';
import { useMatches } from '../hooks/useMatches';

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchesScreen() {
  const { data, loading, error, updatedAt, refresh } = useMatches();
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [query, setQuery] = useState('');
  const { favorites, isFavorite, toggle } = useFavorites();

  const matches = data?.matches.filter((match) => {
    const search = query.trim().toLocaleLowerCase('ru-RU');
    if (![match.home, match.away].some((name) => name.toLocaleLowerCase('ru-RU').includes(search))) return false;
    if (filter === 'all') return true;
    // Перенесённые матчи ещё предстоят. Идущие и неизвестные статусы видны в «Все».
    if (filter === 'upcoming') return match.status === 'scheduled' || match.status === 'postponed';
    return match.status === 'finished';
  }) ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      <Text style={styles.subtitle}>
        {data ? `Тур ${data.round} · ` : ''}{data?.source === 'mock'
          ? 'Демо-данные: сервер вернул 404' : 'Данные с сервера'}
      </Text>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          aria-disabled={loading}
          onPress={() => void refresh()}
          style={[styles.filter, loading && styles.pressedFilter]}
        >
          <Text style={styles.filterText}>{loading ? 'Загрузка…' : 'Обновить'}</Text>
        </Pressable>
      </View>
      {updatedAt && <View style={styles.updated}><UpdatedAgo since={updatedAt} /></View>}
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
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск по названию клуба"
        placeholderTextColor="#777"
        accessibilityLabel="Поиск по названию клуба"
        autoCorrect={false}
        style={styles.search}
      />
      <Text style={styles.timezone}>Время указано в часовом поясе устройства</Text>
      {error && (
        <View style={styles.error} role="alert">
          <Text style={styles.errorText}>{error}</Text>
          {data && <Text style={styles.errorText}>Показаны ранее загруженные матчи.</Text>}
          <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.retry}>
            <Text style={styles.filterText}>Повторить</Text>
          </Pressable>
        </View>
      )}
      {data ? (
        <FlatList
          data={matches}
          extraData={favorites}
          keyExtractor={(match) => match.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.subtitle}>{data.matches.length === 0
            ? 'Матчей пока нет. Попробуйте обновить данные позже.'
            : 'Матчи не найдены. Измените фильтр или поисковый запрос.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.status}>
                  {statusLabels[item.status] ?? 'Статус уточняется'}
                  {item.status === 'live' && item.minute !== undefined ? ` · ${item.minute}′` : ''}
                </Text>
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
      ) : loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#666" />
          <Text style={styles.subtitle}>Загрузка матчей…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 13, color: '#777', marginTop: 8, marginBottom: 16 },
  list: { paddingBottom: 24 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  updated: { marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#222', marginBottom: 10 },
  timezone: { fontSize: 11, color: '#777', marginBottom: 12 },
  error: { padding: 12, borderWidth: 1, borderColor: '#e6b5b5', borderRadius: 6, marginBottom: 12, gap: 8 },
  errorText: { color: '#a52626', fontSize: 13 },
  retry: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#eee', borderRadius: 6 },
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
