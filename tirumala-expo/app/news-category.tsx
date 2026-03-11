import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MainTabAccent } from '@/constants/theme';
import { useLiveUpdates } from '@/hooks/use-live-updates';

type CategoryKey = 'darshan_news' | 'temple_news' | 'events' | 'brahmotsavams' | 'utsavams' | 'vip_news';

const MAX_ITEMS = 20;

export default function NewsCategoryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    category: CategoryKey;
    title: string;
    subtitle: string;
    icon: string;
  }>();
  const accent = MainTabAccent.index;

  const { darshanNews, templeNews, events, brahmotsavams, utsavams, vipNews, loading } =
    useLiveUpdates();

  const dataMap: Record<CategoryKey, { title: string; link?: string; date?: string }[]> = {
    darshan_news: darshanNews,
    temple_news: templeNews,
    events,
    brahmotsavams,
    utsavams,
    vip_news: vipNews,
  };

  const allItems = dataMap[params.category as CategoryKey] ?? [];
  const items = allItems.slice(0, MAX_ITEMS);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: params.title ?? 'News' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>

        {params.subtitle ? (
          <ThemedText style={[styles.subtitle, { color: accent }]}>{params.subtitle}</ThemedText>
        ) : null}

        {loading ? (
          <ThemedText style={styles.metaText}>Loading…</ThemedText>
        ) : null}
        {!loading && items.length === 0 ? (
          <ThemedText style={styles.metaText}>No updates available.</ThemedText>
        ) : null}

        {items.map((item, idx) => (
          <View
            key={`${item.date ?? ''}-${idx}`}
            style={[styles.card, { borderColor: accent + '33', backgroundColor: accent + '0A' }]}>
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accent }]} />

            <View style={styles.cardContent}>
              {/* Date badge */}
              <View style={[styles.dateBadge, { backgroundColor: accent + '18' }]}>
                <MaterialCommunityIcons name="calendar-outline" size={11} color={accent} />
                <ThemedText style={[styles.dateText, { color: accent }]}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'TTD Official'}
                </ThemedText>
              </View>

              {/* Title */}
              <ThemedText style={styles.titleText}>{item.title}</ThemedText>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.sourceBadge}>
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <ThemedText style={styles.sourceText}>TTD Official</ThemedText>
                </View>
                {item.link ? (
                  <Pressable
                    onPress={() => void Linking.openURL(item.link!)}
                    style={({ pressed }) => [
                      styles.readBtn,
                      { borderColor: accent, backgroundColor: accent + '14', opacity: pressed ? 0.75 : 1 },
                    ]}>
                    <ThemedText style={[styles.readBtnText, { color: accent }]}>Read Article</ThemedText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingBottom: 32, gap: 10 },
  subtitle: { fontSize: 12.5, fontWeight: '600', opacity: 0.75, marginBottom: 4 },
  metaText: { fontSize: 13, opacity: 0.55, marginVertical: 16, textAlign: 'center' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  dateText: { fontSize: 10.5, fontWeight: '600' },
  titleText: { fontSize: 13.5, fontWeight: '600', lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  sourceText: { fontSize: 10.5, opacity: 0.55 },
  readBtn: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  readBtnText: { fontSize: 11.5, fontWeight: '700' },
});
