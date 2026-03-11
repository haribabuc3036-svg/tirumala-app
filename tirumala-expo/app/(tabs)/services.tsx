import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resolveTtdIcon } from '@/constants/ttd-service-icons';
import { MainTabAccent } from '@/constants/theme';
import { useServicesCatalog } from '@/hooks/use-services-catalog';
import { type ServiceCategory } from '@/types/services';

const SCREEN_W   = Dimensions.get('window').width;
// list h-padding 16, section h-padding 12×2, gap 10 — show 2 full + ~0.35 peek
const CARD_W      = Math.floor((SCREEN_W - 32 - 24 - 10) / 2.35);
// Icon zone scales with card width (60 %), title = 2 lines × lineHeight
const CARD_ICON_H  = Math.round(CARD_W * 0.60);
const CARD_LINE_H  = 16;
const CARD_TITLE_LINES = 2;
// cardContent height: paddingTop(8) + title + paddingBottom(6)
const CARD_CONTENT_H = 8 + CARD_TITLE_LINES * CARD_LINE_H + 6;
// cardBottom height: paddingTop(4) + arrow(24) + paddingBottom(10)
const CARD_BOTTOM_H  = 4 + 24 + 10;
const CARD_H         = CARD_ICON_H + CARD_CONTENT_H + CARD_BOTTOM_H;

// hex → rgba helper
function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Service card (vertical) ──────────────────────────────────────────────────
function ServiceCard({
  service,
  isDark,
  accent,
}: {
  service: ServiceCategory['services'][number];
  isDark: boolean;
  accent: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [scale]);

  const cardBg     = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? '#2C2C2E' : '#EBEBED';
  const iconBg     = isDark ? '#2A2A2C' : '#F4F4F6';
  const iconColor  = isDark ? '#E5E7EB' : '#1C1C1E';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.card,
          { width: CARD_W, backgroundColor: cardBg, borderColor: cardBorder, transform: [{ scale }] },
        ]}>
        {/* Icon area */}
        <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
          {service.iconImage ? (
            <Image source={{ uri: service.iconImage }} style={styles.cardIconImage} contentFit="contain" />
          ) : (
            <MaterialCommunityIcons
              name={resolveTtdIcon(service.title, service.icon)}
              size={Math.round(CARD_W * 0.20)}
              color={iconColor}
            />
          )}
        </View>

        {/* Title */}
        <View style={styles.cardContent}>
          <ThemedText style={styles.cardTitle} numberOfLines={CARD_TITLE_LINES}>
            {service.title}
          </ThemedText>
        </View>

        {/* Bottom row: tag (or spacer) + arrow */}
        <View style={styles.cardBottom}>
          {service.tag ? (
            <View style={[styles.cardTag, { backgroundColor: hexAlpha(service.tagColor ?? accent, 0.14) }]}>
              <ThemedText style={[styles.cardTagText, { color: service.tagColor ?? accent }]} numberOfLines={1}>
                {service.tag}
              </ThemedText>
            </View>
          ) : <View />}
          <View style={[styles.cardArrow, { backgroundColor: hexAlpha(accent, 0.1) }]}>
            <MaterialCommunityIcons name="arrow-right" size={13} color={accent} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonSection({ isDark }: { isDark: boolean }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  const loop = useCallback(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.5, duration: 750, useNativeDriver: true }),
    ]).start(loop);
  }, [opacity]);

  useEffect(() => {
    loop();
    return () => opacity.stopAnimation();
  }, [loop, opacity]);

  const shimmer = isDark ? '#333336' : '#E4E4E7';
  const bg      = isDark ? '#1C1C1E' : '#FFFFFF';
  const border  = isDark ? '#2C2C2E' : '#EBEBED';

  return (
    <View style={[styles.sectionWrap, { backgroundColor: bg, borderColor: border }]}>
      {/* Skeleton gradient header */}
      <Animated.View style={[styles.skeletonGradientHeader, { backgroundColor: shimmer, opacity }]} />
      <View style={styles.skeletonCardRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonCard, { width: CARD_W, backgroundColor: shimmer, opacity }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const accent = MainTabAccent.services;
  const { categories, loading, error } = useServicesCatalog();

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.tag ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.services.length > 0 || cat.heading.toLowerCase().includes(q));
  }, [categories, query]);

  const totalServices = useMemo(
    () => categories.reduce((sum, c) => sum + c.services.length, 0),
    [categories]
  );

  // Theme tokens
  const pageBg      = isDark ? '#111113' : '#F2F2F7';
  const sectionBg   = isDark ? '#1C1C1E' : '#FFFFFF';
  const sectionBorder= isDark ? '#2C2C2E' : '#EBEBED';
  const inputBg     = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBorder = isDark ? '#2C2C2E' : '#E4E4E7';
  const inputText   = isDark ? '#E5E7EB' : '#111827';
  const placeholder = isDark ? '#6B7280' : '#9CA3AF';

  const renderCategory = useCallback(({ item: category }: { item: ServiceCategory }) => {
    // Gradient colours for header
    const gradStart = accent;
    const gradEnd   = isDark ? hexAlpha(accent, 0.55) : hexAlpha(accent, 0.72);

    return (
      <View style={[styles.sectionWrap, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>

        {/* ── Gradient header ── */}
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}>
          <View style={styles.gradientHeaderIcon}>
            {category.image ? (
              <Image source={{ uri: category.image }} style={styles.sectionHeaderImage} contentFit="contain" />
            ) : (
              <MaterialCommunityIcons
                name={resolveTtdIcon(category.heading, category.icon)}
                size={18}
                color="#FFFFFF"
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.gradientTitle} numberOfLines={1}>
              {category.heading}
            </ThemedText>
            <ThemedText style={styles.gradientMeta}>
              {category.services.length} service{category.services.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
        </LinearGradient>

        {/* ── Peek scroll row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.peekScroll}
          decelerationRate="fast"
          snapToInterval={CARD_W + 10}
          snapToAlignment="start">
          {category.services.map((service) => (
            <ServiceCard key={service.id} service={service} isDark={isDark} accent={accent} />
          ))}
        </ScrollView>
      </View>
    );
  }, [accent, isDark, sectionBg, sectionBorder]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title" style={styles.pageTitle}>Services</ThemedText>
            {!loading && totalServices > 0 ? (
              <ThemedText style={styles.pageMeta}>
                {totalServices} services · {categories.length} categories
              </ThemedText>
            ) : null}

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={placeholder} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: inputText }]}
                placeholder="Search services…"
                placeholderTextColor={placeholder}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={placeholder} />
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#EF4444" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 12 }}>
              {[0, 1, 2].map((i) => <SkeletonSection key={i} isDark={isDark} />)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="magnify-close" size={32} color={placeholder} />
              </View>
              <ThemedText style={styles.emptyTitle}>No services found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Try a different search term or browse all categories.
              </ThemedText>
              {query ? (
                <Pressable
                  onPress={() => setQuery('')}
                  style={[styles.clearBtn, { borderColor: sectionBorder, backgroundColor: sectionBg }]}>
                  <ThemedText style={[styles.clearBtnText, { color: accent }]}>Clear search</ThemedText>
                </Pressable>
              ) : null}
            </View>
          )
        }
        renderItem={renderCategory}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 44,
  },

  // ── Header ──────────────────────────────
  header: {
    marginBottom: 20,
    gap: 10,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pageMeta: {
    fontSize: 13,
    opacity: 0.4,
    marginTop: -4,
  },

  // ── Search ──────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  // ── Error ───────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A540',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    fontSize: 12.5,
    color: '#EF4444',
    flex: 1,
  },

  // ── Section ─────────────────────────────
  sectionWrap: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // ── Gradient header ──────────────────────
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gradientHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderImage: {
    width: 22,
    height: 22,
  },
  gradientTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  gradientMeta: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },

  // ── Peek scroll ──────────────────────────
  peekScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },

  // ── Card ─────────────────────────────────
  card: {
    height: CARD_H,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardIconWrap: {
    height: CARD_ICON_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconImage: {
    width: Math.round(CARD_W * 0.28),
    height: Math.round(CARD_W * 0.28),
  },
  cardContent: {
    height: CARD_CONTENT_H,
    paddingHorizontal: 10,
    paddingTop: 8,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: Math.max(11, Math.min(13, CARD_W * 0.09)),
    lineHeight: CARD_LINE_H,
    fontWeight: '500',
  },
  cardBottom: {
    height: CARD_BOTTOM_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  cardTag: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTagText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardArrow: {
    width: 24,
    height: 24,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Empty state ──────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 10,
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    opacity: 0.45,
    textAlign: 'center',
    lineHeight: 19,
  },
  clearBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  clearBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },

  // ── Skeleton ─────────────────────────────
  skeletonGradientHeader: {
    height: 66,
  },
  skeletonCardRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  skeletonCard: {
    height: CARD_H,
    borderRadius: 14,
  },
});
