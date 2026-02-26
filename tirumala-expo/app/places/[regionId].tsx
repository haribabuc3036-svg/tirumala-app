import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRegionPlaces } from '@/hooks/use-region-places';

export default function RegionPlacesScreen() {
  const { regionId } = useLocalSearchParams<{ regionId: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon;
  const textColor = Colors[colorScheme].text;

  const { region, places, loading, error } = useRegionPlaces(regionId);

  if (!loading && !region) {
    return (
      <ThemedView style={[styles.emptyWrap, { paddingTop: insets.top + 16 }]}> 
        <ThemedText type="title">{error ? `Unable to load region: ${error}` : 'Region not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: region?.title ?? 'Places' }} />
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{region?.title ?? 'Places'}</ThemedText>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryChip, { backgroundColor: `${tintColor}18` }]}>
                <ThemedText style={[styles.summaryText, { color: tintColor }]}>{places.length} Places</ThemedText>
              </View>
            </View>
            {loading ? <ThemedText style={styles.metaText}>Loading places...</ThemedText> : null}
            {error ? <ThemedText style={styles.metaText}>Unable to load places: {error}</ThemedText> : null}
            {!loading && !error && places.length === 0 ? (
              <ThemedText style={styles.metaText}>No places available in this region yet.</ThemedText>
            ) : null}

            <View style={[styles.heroCard, { borderColor, backgroundColor: `${tintColor}12` }]}>
              <View style={[styles.heroGradientOne, { backgroundColor: `${tintColor}22` }]} />
              <View style={[styles.heroGradientTwo, { backgroundColor: `${borderColor}20` }]} />
              <View style={[styles.heroGradientThree, { backgroundColor: `${tintColor}18` }]} />

              <View style={[styles.heroIcon, { backgroundColor: `${tintColor}20` }]}>
                <MaterialCommunityIcons name="map-check-outline" size={20} color={tintColor} />
              </View>
              <View style={styles.heroTextWrap}>
                <ThemedText type="defaultSemiBold">Top places in {region?.title ?? 'this region'}</ThemedText>
                <ThemedText style={styles.heroSub}>{region?.subtitle ?? 'Places in this section'}</ThemedText>
              </View>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
            <Pressable
              onPress={() => router.push({ pathname: '/place/[placeId]', params: { placeId: item.id } })}
              style={({ pressed }) => [
                styles.placeCard,
                {
                  borderColor,
                  backgroundColor: `${textColor}08`,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}>
              <View style={styles.thumbWrap}>
                {item.photos[0] ? (
                  <Image source={{ uri: item.photos[0] }} style={styles.thumb} contentFit="cover" transition={180} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: `${tintColor}18` }]}>
                    <MaterialCommunityIcons name="image-off-outline" size={18} color={tintColor} />
                  </View>
                )}
                <View style={[styles.thumbPill, { backgroundColor: `${tintColor}22` }]}>
                  <MaterialCommunityIcons name="camera-outline" size={11} color={tintColor} />
                  <ThemedText style={[styles.thumbPillText, { color: tintColor }]}>{item.photos.length}</ThemedText>
                </View>
              </View>

              <View style={styles.textWrap}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
                <ThemedText style={styles.subText} numberOfLines={2}>
                  {item.distanceFromTirumalaKm} km from Tirumala
                </ThemedText>

                <View style={[styles.distancePill, { backgroundColor: `${tintColor}18` }]}>
                  <MaterialCommunityIcons name="map-marker-distance" size={12} color={tintColor} />
                  <ThemedText style={[styles.distancePillText, { color: tintColor }]}>View details</ThemedText>
                </View>
              </View>

              <View style={[styles.arrowWrap, { borderColor, backgroundColor: `${textColor}12` }]}>
                <MaterialCommunityIcons name="arrow-top-right" size={14} color={borderColor} />
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 10,
  },
  header: {
    marginBottom: 10,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    minHeight: 92,
  },
  heroGradientOne: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -18,
    top: -34,
  },
  heroGradientTwo: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    right: 62,
    top: 10,
  },
  heroGradientThree: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    left: -28,
    bottom: -36,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroIcon: {
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
  heroSub: {
    fontSize: 12,
    opacity: 0.78,
    lineHeight: 17,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.75,
  },
  placeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPill: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thumbPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  subText: {
    fontSize: 12,
    opacity: 0.7,
  },
  distancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distancePillText: {
    fontSize: 11,
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
