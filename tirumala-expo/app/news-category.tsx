import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MainTabAccent } from '@/constants/theme';
import { useLiveUpdates } from '@/hooks/use-live-updates';

type CategoryKey = 'darshan_news' | 'temple_news' | 'events' | 'brahmotsavams' | 'utsavams' | 'vip_news';
const MAX_ITEMS = 20;

function SkeletonCard({ accent }: { accent: string }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  Animated.loop(
    Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])
  ).start();
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  return (
    <View style={[styles.card, { borderColor: accent + '25', backgroundColor: accent + '08' }]}>
      <View style={[styles.accentBar, { backgroundColor: accent + '40' }]} />
      <View style={{ flex: 1, padding: 14, gap: 10 }}>
        <Animated.View style={{ opacity }}>
          <View style={{ width: 90, height: 14, backgroundColor: accent + '35', borderRadius: 7 }} />
        </Animated.View>
        <Animated.View style={{ opacity, gap: 6 }}>
          <View style={{ width: '100%', height: 13, backgroundColor: accent + '25', borderRadius: 6 }} />
          <View style={{ width: '85%', height: 13, backgroundColor: accent + '25', borderRadius: 6 }} />
          <View style={{ width: '65%', height: 13, backgroundColor: accent + '25', borderRadius: 6 }} />
        </Animated.View>
        <Animated.View style={[{ opacity }, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ width: 70, height: 11, backgroundColor: accent + '20', borderRadius: 5 }} />
          <View style={{ width: 80, height: 28, backgroundColor: accent + '20', borderRadius: 8 }} />
        </Animated.View>
      </View>
    </View>
  );
}

function NewsCard({ item, idx, accent, icon }: {
  item: { title: string; link?: string; date?: string };
  idx: number; accent: string; icon: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={onPressIn} onPressOut={onPressOut}
        onPress={() => item.link ? void WebBrowser.openBrowserAsync(item.link, { toolbarColor: '#0f172a', controlsColor: '#22c55e', presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }) : undefined}
        style={[styles.card, { borderColor: accent + '30', backgroundColor: accent + '08' }]}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={[styles.idxBadge, { backgroundColor: accent + '20' }]}>
              <ThemedText style={[styles.idxText, { color: accent }]}>{String(idx + 1).padStart(2, '0')}</ThemedText>
            </View>
            {formattedDate ? (
              <View style={[styles.dateBadge, { backgroundColor: accent + '15' }]}>
                <MaterialCommunityIcons name="calendar-outline" size={10} color={accent} />
                <ThemedText style={[styles.dateText, { color: accent }]}>{formattedDate}</ThemedText>
              </View>
            ) : null}
            <View style={[styles.iconChip, { backgroundColor: accent + '15' }]}>
              <MaterialCommunityIcons name={icon as any} size={12} color={accent} />
            </View>
          </View>
          <ThemedText style={styles.titleText}>{item.title}</ThemedText>
          <View style={styles.cardFooter}>
            <View style={styles.sourcePill}>
              <View style={[styles.sourceDot, { backgroundColor: accent }]} />
              <ThemedText style={styles.sourceLabel}>TTD Official</ThemedText>
            </View>
            {item.link ? (
              <View style={[styles.readBtn, { borderColor: accent + '60', backgroundColor: accent + '12' }]}>
                <ThemedText style={[styles.readBtnText, { color: accent }]}>Read Article</ThemedText>
                <MaterialCommunityIcons name="arrow-top-right" size={11} color={accent} />
              </View>
            ) : (
              <View style={[styles.readBtn, { borderColor: accent + '30', backgroundColor: accent + '08' }]}>
                <ThemedText style={[styles.readBtnText, { color: accent + 'AA' }]}>No Link</ThemedText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function NewsCategoryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category: CategoryKey; title: string; subtitle: string; icon: string }>();
  const accent = MainTabAccent.index;
  const isDark = useColorScheme() === 'dark';
  const icon = params.icon ?? 'newspaper-variant-outline';
  const { darshanNews, templeNews, events, brahmotsavams, utsavams, vipNews, loading } = useLiveUpdates();

  const dataMap: Record<CategoryKey, { title: string; link?: string; date?: string }[]> = {
    darshan_news: darshanNews, temple_news: templeNews, events, brahmotsavams, utsavams, vip_news: vipNews,
  };
  const allItems = dataMap[params.category as CategoryKey] ?? [];
  const items = allItems.slice(0, MAX_ITEMS);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} tintColor={accent} colors={[accent]} />}>

        <LinearGradient
          colors={['transparent', accent + '44', accent + 'BB', accent + 'EE']}
          start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIconWrap, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
            }]}>
              <MaterialCommunityIcons name={icon as any} size={26} color={isDark ? '#fff' : '#000'} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.heroTitle, { color: isDark ? '#fff' : '#000' }]}>{params.title ?? 'News'}</ThemedText>
              {params.subtitle ? <ThemedText style={[styles.heroSubtitle, { color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.6)' }]}>{params.subtitle}</ThemedText> : null}
            </View>
          </View>
          <View style={styles.heroCountRow}>
            <View style={[styles.countBadge, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
            }]}>
              <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={13} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'} />
              <ThemedText style={[styles.countText, { color: isDark ? '#fff' : '#000' }]}>
                {loading ? 'Loading…' : `${items.length} of ${allItems.length} articles`}
              </ThemedText>
            </View>
            <View style={styles.sourceBadgeHero}>
              <MaterialCommunityIcons name="shield-check-outline" size={12} color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.55)'} />
              <ThemedText style={[styles.sourceHeroText, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }]}>TTD Official Source</ThemedText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.listWrap}>
          {loading ? [0, 1, 2].map((i) => <SkeletonCard key={i} accent={accent} />) : null}
          {!loading && items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: accent + '18' }]}>
                <MaterialCommunityIcons name="inbox-outline" size={36} color={accent} />
              </View>
              <ThemedText style={styles.emptyTitle}>No updates yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>Check back soon — TTD publishes updates regularly.</ThemedText>
            </View>
          ) : null}
          {!loading ? items.map((item, idx) => (
            <NewsCard key={`${item.date ?? ''}-${idx}`} item={item} idx={idx} accent={accent} icon={icon} />
          )) : null}
          {!loading && items.length > 0 ? (
            <View style={styles.listFooter}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={accent + '80'} />
              <ThemedText style={[styles.footerLabel, { color: accent + '80' }]}>
                Showing {items.length} most recent articles
              </ThemedText>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  hero: { paddingHorizontal: 18, paddingBottom: 28, gap: 16 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#000', lineHeight: 27 },
  heroSubtitle: { fontSize: 12.5, color: 'rgba(0,0,0,0.6)', marginTop: 2, fontWeight: '500' },
  heroCountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },
  countText: { fontSize: 11.5, fontWeight: '700', color: '#000' },
  sourceBadgeHero: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceHeroText: { fontSize: 11, color: 'rgba(0,0,0,0.55)', fontWeight: '500' },
  listWrap: { paddingHorizontal: 14, paddingTop: 10, gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  accentBar: { width: 4 },
  cardInner: { flex: 1, padding: 14, gap: 11 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  idxBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  idxText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  dateText: { fontSize: 10, fontWeight: '600' },
  iconChip: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  titleText: { fontSize: 14, fontWeight: '600', lineHeight: 21, opacity: 0.92 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sourcePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sourceDot: { width: 5, height: 5, borderRadius: 3 },
  sourceLabel: { fontSize: 10.5, opacity: 0.5, fontWeight: '500' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
  readBtnText: { fontSize: 11.5, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', opacity: 0.8 },
  emptySubtitle: { fontSize: 12.5, opacity: 0.5, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 },
  listFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 16 },
  footerLabel: { fontSize: 11.5, fontWeight: '500' },
});
