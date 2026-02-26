import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { usePlaceDetail } from '@/hooks/use-place-detail';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PlaceDetailScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon;
  const textColor = Colors[colorScheme].text;
  const locationChipBackground = colorScheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.96)';
  const locationChipText = '#1E2A32';
  const buttonTextColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const { place, loading, error } = usePlaceDetail(placeId);

  const openMaps = async () => {
    if (!place) return;
    const canOpen = await Linking.canOpenURL(place.mapsUrl);
    if (!canOpen) {
      Alert.alert('Unable to open maps', 'Please try again later.');
      return;
    }
    await Linking.openURL(place.mapsUrl);
  };

  if (!loading && !place) {
    return (
      <ThemedView style={[styles.emptyWrap, { paddingTop: insets.top + 16 }]}> 
        <ThemedText type="title">{error ? `Unable to load place: ${error}` : 'Place not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: place?.name ?? 'Place' }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {loading ? <ThemedText style={styles.statusText}>Loading place details...</ThemedText> : null}
        {error ? <ThemedText style={styles.statusText}>Unable to load place details: {error}</ThemedText> : null}

        {place ? (
          <>
        <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
          {place.photos[0] ? (
            <Image source={{ uri: place.photos[0] }} style={styles.heroImage} contentFit="cover" transition={220} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback, { backgroundColor: `${tintColor}18` }]}>
              <MaterialCommunityIcons name="image-off-outline" size={24} color={tintColor} />
            </View>
          )}
          <View style={styles.heroOverlay} />

          <View style={[styles.heroBottomChip, { backgroundColor: locationChipBackground, borderColor }]}> 
            <MaterialCommunityIcons name="map-marker-distance" size={13} color={tintColor} />
            <ThemedText style={[styles.heroBottomChipText, { color: locationChipText }]}>
              {place.distanceFromTirumalaKm} km from Tirumala
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(420)}>
          <ThemedText type="title" style={styles.title}>
            {place.name}
          </ThemedText>
        </Animated.View>


        <Animated.View entering={FadeInDown.delay(170).duration(420)} style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="image-filter-center-focus" size={15} color={tintColor} />
          <ThemedText style={[styles.sectionTitleText, { color: borderColor }]}>Gallery</ThemedText>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {place.photos.map((photo, index) => (
            <View key={`${place.id}-${index}`} style={styles.photoCard}>
              <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" transition={200} />
            </View>
          ))}
        </ScrollView>

        <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="text-box-outline" size={15} color={tintColor} />
          <ThemedText style={[styles.sectionTitleText, { color: borderColor }]}>About</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(420)} style={[styles.descriptionCard, { borderColor, backgroundColor: `${textColor}07` }]}>
                    <ThemedText style={styles.description}>{place.description}</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(420)}>
          <Pressable style={[styles.mapButton, { backgroundColor: tintColor }]} onPress={openMaps}>
          <View style={styles.mapButtonInner}>
            <MaterialCommunityIcons name="google-maps" size={18} color={buttonTextColor} />
            <ThemedText style={[styles.mapButtonText, { color: buttonTextColor }]}>Open in Google Maps</ThemedText>
          </View>
          </Pressable>
        </Animated.View>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    gap: 14,
  },
  heroWrap: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 228,
    borderRadius: 18,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 18, 24, 0.28)',
  },
  heroBottomChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroBottomChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoThumbRing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: 12,
  },
  infoThumb: {
    width: '100%',
    height: '100%',
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.9,
  },
  distanceSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoAccent: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sectionTitleText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
    opacity: 0.82,
  },
  photoRow: {
    gap: 10,
    paddingRight: 8,
  },
  photoCard: {
    position: 'relative',
  },
  photo: {
    width: 240,
    height: 160,
    borderRadius: 14,
  },
  descriptionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    opacity: 0.9,
  },
  mapButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  mapButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.75,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
