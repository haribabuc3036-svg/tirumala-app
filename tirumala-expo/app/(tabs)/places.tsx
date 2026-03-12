import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePlacesRegions } from '@/hooks/use-places-regions';

const REGION_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  tirumala: 'temple-hindu',
  tirupati: 'city-variant-outline',
  chandragiri: 'castle',
  vadamalapeta: 'map-marker-multiple-outline',
  chittoor: 'pine-tree',
  'nearby-cities': 'map-search-outline',
};

export default function PlacesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const tintColor = MainTabAccent.places;
  const borderColor = tintColor;
  const backgroundColor = Colors[colorScheme].background;
  const isDark = colorScheme === 'dark';
  const { regions, loading, error } = usePlacesRegions();

  return (
    <ThemedView style={styles.container}>
      {/* ── Fixed gradient header ── */}
      <LinearGradient
        colors={isDark ? [tintColor + 'CC', tintColor + '66', 'transparent'] : [tintColor + 'DD', tintColor + '88', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        {/* Decorative blobs */}
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#fff', opacity: 0.05, top: -28, right: -20 }} />
        <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', opacity: 0.04, bottom: -10, left: -12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }}>
            <MaterialCommunityIcons name="map-marker-star-outline" size={22} color={isDark ? '#fff' : '#1a1a1a'} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.3, color: isDark ? '#fff' : '#1a1a1a' }}>Places</ThemedText>
            <ThemedText style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.50)', marginTop: 1 }}>Browse temples & pilgrim destinations</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={regions}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText style={[styles.sectionLabel, { color: tintColor }]}>Regions</ThemedText>
            {error ? <ThemedText style={styles.fallbackNote}>Unable to load regions: {error}</ThemedText> : null}
            {loading ? <ThemedText style={styles.fallbackNote}>Loading places...</ThemedText> : null}
            {!loading && regions.length === 0 ? (
              <ThemedText style={styles.fallbackNote}>No regions available yet.</ThemedText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const count = item.placeCount;
          const previewPhoto = item.previewPhoto;
          const cardBackground = `${tintColor}0A`;
          const iconBg = `${tintColor}26`;
          const chipBg = `${tintColor}20`;
          const chipTextColor = tintColor;

          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/places/[regionId]', params: { regionId: item.id } })
              }
              style={({ pressed }) => [
                styles.regionCard,
                {
                  borderColor,
                  backgroundColor: cardBackground,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}>
              <View style={styles.imageWrap}>
                {previewPhoto ? (
                  <Image source={{ uri: previewPhoto }} style={styles.regionImage} contentFit="cover" transition={180} />
                ) : (
                  <View style={[styles.imageFallback, { backgroundColor: `${tintColor}1A` }]}>
                    <MaterialCommunityIcons name="image-off-outline" size={22} color={tintColor} />
                  </View>
                )}

                <View style={[styles.imageTopFade, { backgroundColor: `${backgroundColor}22` }]} />

                <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons
                    name={REGION_ICONS[item.id] ?? 'map-marker-radius-outline'}
                    size={13}
                    color={tintColor}
                  />
                </View>
              </View>

              <View style={styles.regionTextWrap}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {item.title}
                </ThemedText>
                {item.subtitle ? (
                  <ThemedText style={styles.regionSub} numberOfLines={2}>
                    {item.subtitle}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <View style={[styles.countPill, { backgroundColor: chipBg }]}>
                  <ThemedText style={[styles.countText, { color: chipTextColor }]}>{count} places</ThemedText>
                </View>
                <View style={[styles.arrowWrap, { borderColor, backgroundColor: `${backgroundColor}40` }]}>
                  <MaterialCommunityIcons name="arrow-top-right" size={14} color={tintColor} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  listHeader: {
    marginBottom: 6,
    gap: 4,
  },
  pageHeader: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    marginBottom: 2,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBlobOne: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    right: -12,
    top: -20,
  },
  heroBlobTwo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    right: 34,
    bottom: -18,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
    gap: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.78,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  fallbackNote: {
    fontSize: 11,
    opacity: 0.7,
  },
  regionCard: {
    width: '48.4%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    minHeight: 190,
  },
  imageWrap: {
    position: 'relative',
  },
  regionImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
  },
  imageTopFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageFallback: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionTextWrap: {
    gap: 2,
    minHeight: 46,
  },
  regionSub: {
    fontSize: 11,
    opacity: 0.7,
    lineHeight: 15,
  },
  metaRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
