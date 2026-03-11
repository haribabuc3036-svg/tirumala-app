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
  accent,
}: {
  service: ServiceCategory['services'][number];
  isDark: boolean;
  accent: string;
}) {
  const [titleExpanded, setTitleExpanded] = useState(false);

  const iconColor  = isDark ? '#E5E7EB' : '#374151';
  const textColor  = isDark ? '#D1D5DB' : '#1F2937';
  const iconBg     = isDark ? hexAlpha(accent, 0.18) : hexAlpha(accent, 0.10);

  return (
    <View style={[styles.tile, { width: TILE_W }]}>
      {/* Icon — tap to navigate */}
      <Pressable
        onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
        style={({ pressed }) => [styles.tileIconWrap, { backgroundColor: iconBg }, pressed && { opacity: 0.55 }]}>
        {service.iconImage ? (
          <Image source={{ uri: service.iconImage }} style={styles.tileIconImage} contentFit="contain" />
        ) : (
          <MaterialCommunityIcons
            name={resolveTtdIcon(service.title, service.icon)}
            size={ICON_SIZE}
            color={isDark ? hexAlpha(accent, 0.9) : accent}
          />
        )}
      </Pressable>

      {/* Title — tap to expand */}
      <Pressable onPress={() => setTitleExpanded((v) => !v)} hitSlop={6}>
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

  // Theme tokens
  const pageBg      = isDark ? '#111113' : '#F2F2F7';
  const sectionBg   = isDark ? '#1C1C1E' : '#FFFFFF';
  const sectionBorder= isDark ? '#2C2C2E' : '#EBEBED';
  const inputBg     = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBorder = isDark ? '#2C2C2E' : '#E4E4E7';
  const inputText   = isDark ? '#E5E7EB' : '#111827';
  const placeholder = isDark ? '#6B7280' : '#9CA3AF';

  const renderCategory = useCallback(({ item: category }: { item: ServiceCategory }) => {
    const gradStart = accent;
    const gradMid   = isDark ? hexAlpha(accent, 0.75) : hexAlpha(accent, 0.85);
    const gradEnd   = isDark ? hexAlpha(accent, 0.40) : hexAlpha(accent, 0.55);

    return (
      <View style={[styles.sectionWrap, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>

        {/* ── Gradient header ── */}
        <LinearGradient
          colors={[gradStart, gradMid, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}>
          {/* Decorative circles */}
          <View style={styles.headerDecorCircle1} />
          <View style={styles.headerDecorCircle2} />

          <View style={styles.gradientHeaderIcon}>
            {category.image ? (
              <Image source={{ uri: category.image }} style={styles.sectionHeaderImage} contentFit="contain" />
            ) : (
              <MaterialCommunityIcons
                name={resolveTtdIcon(category.heading, category.icon)}
                size={20}
                color="#FFFFFF"
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.gradientTitle} numberOfLines={1}>
              {category.heading}
            </ThemedText>
          </View>
          <View style={styles.headerBadge}>
            <ThemedText style={styles.headerBadgeText}>{category.services.length}</ThemedText>
          </View>
        </LinearGradient>

        {/* ── 4-per-row tile grid ── */}
        <View style={styles.gridContainer}>
          {category.services.map((service) => (
            <ServiceTile key={service.id} service={service} isDark={isDark} accent={accent} />
          ))}
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
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* ── Beautiful gradient page header ── */}
            <LinearGradient
              colors={[isDark ? '#111113' : '#F2F2F7', hexAlpha(accent, 0.70), accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.4, y: 1 }}
              style={[styles.pageHeader, { paddingTop: insets.top + 18 }]}>
              {/* Decorative blobs */}
              <View style={[styles.blobTopRight, { backgroundColor: hexAlpha('#FFFFFF', 0.08) }]} />
              <View style={[styles.blobBottomLeft, { backgroundColor: hexAlpha('#FFFFFF', 0.05) }]} />

              <View style={styles.pageHeaderContent}>
                <View style={[styles.pageHeaderIcon, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
                }]}>
                  <MaterialCommunityIcons name="hands-pray" size={28} color={isDark ? '#fff' : '#000'} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.pageTitle, { color: isDark ? '#fff' : '#000' }]}>TTD Services</ThemedText>
                  <ThemedText style={[styles.pageSubtitle, { color: isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.6)' }]}>Tirumala Tirupati Devasthanams</ThemedText>
                </View>
              </View>

              {/* Search bar floats inside header */}
              <View style={[styles.searchBar, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                marginTop: 18,
              }]}>
                <MaterialCommunityIcons name="magnify" size={18} color={isDark ? 'rgba(255,255,255,0.6)' : placeholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#FFFFFF' : inputText }]}
                  placeholder="Search services…"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.45)' : placeholder}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={10}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : placeholder} />
                  </Pressable>
                ) : null}
              </View>
            </LinearGradient>

            {error ? (
              <View style={[styles.errorBanner, { marginHorizontal: 16, marginTop: 12 }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#EF4444" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={{ height: 16 }} />
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
    paddingBottom: 48,
  },

  // ── Page gradient header ─────────────────
  pageHeader: {
    marginHorizontal: -16,
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -50,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 10,
    left: -30,
  },
  pageHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pageHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Search ──────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
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
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Gradient header ──────────────────────
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  headerDecorCircle1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.10)',
    right: 20,
    top: -30,
  },
  headerDecorCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: -10,
    bottom: -20,
  },
  gradientHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderImage: {
    width: 22,
    height: 22,
  },
  gradientTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── 4-per-row tile grid ──────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
  },

  // ── Tile ───────────────────────────────────────────
  tile: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tileIconWrap: {
    width: TILE_W - 6,
    height: TILE_W - 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
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
    marginTop: 6,
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
