import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPlacesByRegion, REGIONS } from '@/constants/places-data';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const tintColor = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon;
  const textColor = Colors[colorScheme].text;
  const backgroundColor = Colors[colorScheme].background;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={REGIONS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Places</ThemedText>
            <View style={[styles.heroCard, { borderColor, backgroundColor: `${tintColor}12` }]}>
              <View style={[styles.heroBlobOne, { backgroundColor: `${tintColor}14` }]} />
              <View style={[styles.heroBlobTwo, { backgroundColor: `${borderColor}14` }]} />
              <View style={[styles.heroIconWrap, { backgroundColor: `${tintColor}20` }]}>
                <MaterialCommunityIcons name="map-marker-star-outline" size={20} color={tintColor} />
              </View>
              <View style={styles.heroTextWrap}>
                <ThemedText type="defaultSemiBold">Pilgrim Places Explorer</ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Browse by region, then open each place for distance, photos, and maps.
                </ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.sectionLabel, { color: borderColor }]}>Regions</ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const places = getPlacesByRegion(item.id);
          const count = places.length;
          const previewPhoto = places[0]?.photos?.[0];
          const accentVariant = count % 3;

          const cardBackground =
            accentVariant === 0
              ? `${tintColor}0A`
              : accentVariant === 1
              ? `${borderColor}11`
              : `${textColor}08`;

          const iconBg =
            accentVariant === 0
              ? `${tintColor}26`
              : accentVariant === 1
              ? `${borderColor}26`
              : `${tintColor}1D`;

          const chipBg =
            accentVariant === 0
              ? `${tintColor}20`
              : accentVariant === 1
              ? `${borderColor}22`
              : `${tintColor}16`;

          const chipTextColor = accentVariant === 1 ? borderColor : tintColor;

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
                  <MaterialCommunityIcons name="arrow-top-right" size={14} color={borderColor} />
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
    paddingBottom: 24,
    gap: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: {
    marginBottom: 10,
    gap: 8,
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
