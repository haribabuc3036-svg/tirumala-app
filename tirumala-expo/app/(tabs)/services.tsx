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
// 4-per-row: list pad 16×2, section pad 8×2
const TILE_W    = Math.floor((SCREEN_W - 32 - 16) / 4);
const ICON_SIZE = Math.round(TILE_W * 0.46);
const ICON_IMG  = Math.round(TILE_W * 0.40);

// hex → rgba helper
function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Service tile ─────────────────────────────────────────────────────────────
function ServiceTile({
  service,
  isDark,
}: {
  service: ServiceCategory['services'][number];
  isDark: boolean;
  accent: string;
}) {
  const [titleExpanded, setTitleExpanded] = useState(false);

  const iconColor = isDark ? '#E5E7EB' : '#374151';
  const textColor = isDark ? '#D1D5DB' : '#111827';

  return (
    <View style={[styles.tile, { width: TILE_W }]}>
      {/* Icon — tap to navigate */}
      <Pressable
        onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
        style={({ pressed }) => [styles.tileIconWrap, pressed && { opacity: 0.55 }]}>
        {service.iconImage ? (
          <Image source={{ uri: service.iconImage }} style={styles.tileIconImage} contentFit="contain" />
        ) : (
          <MaterialCommunityIcons
            name={resolveTtdIcon(service.title, service.icon)}
            size={ICON_SIZE}
            color={iconColor}
          />
        )}
      </Pressable>

      {/* Title — tap to expand */}
      <Pressable
        onPress={() => setTitleExpanded((v) => !v)}
        hitSlop={6}>
        <ThemedText
          style={[styles.tileTitle, { color: textColor }]}
          numberOfLines={titleExpanded ? undefined : 2}>
          {service.title}
        </ThemedText>
      </Pressable>
    </View>
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
      <Animated.View style={[styles.skeletonGradientHeader, { backgroundColor: shimmer, opacity }]} />
      <View style={styles.gridContainer}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonTile, { width: TILE_W, backgroundColor: shimmer, opacity }]}
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

        {/* ── 4-per-row tile grid ── */}
        <View style={styles.gridContainer}>
          {category.services.map((service) => (
            <ServiceTile key={service.id} service={service} isDark={isDark} accent={accent} />
          ))}
          {/* Fill last row so space-between stays even */}
          {Array.from({ length: (4 - (category.services.length % 4)) % 4 }).map((_, i) => (
            <View key={`spacer-${i}`} style={{ width: TILE_W }} />
          ))}
        </View>
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

  // ── 4-per-row tile grid ──────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },

  // ── Tile ───────────────────────────────────────────
  tile: {
    alignItems: 'center',
    marginBottom: 14,
  },
  tileIconWrap: {
    width: TILE_W - 8,
    height: TILE_W - 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  tileIconImage: {
    width: ICON_IMG,
    height: ICON_IMG,
  },
  tileTitleWrap: {},
  tileTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 5,
    paddingHorizontal: 2,
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

  skeletonTile: {
    height: TILE_W,
    borderRadius: 14,
    marginBottom: 14,
  },
});
