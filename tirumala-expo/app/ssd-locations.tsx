import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSsdLocations } from '@/hooks/use-ssd-locations';

// Placeholder images used when a location has no remote image_url
const PLACEHOLDER_IMAGES = [
  require('../assets/images/banner-image.png'),
  require('../assets/images/explore-hero-image.png'),
  require('../assets/images/support-hero-image.png'),
  require('../assets/images/banner-image.png'),
  require('../assets/images/explore-hero-image.png'),
  require('../assets/images/support-hero-image.png'),
];

export default function SsdLocationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const insets = useSafeAreaInsets();
  const { locations, loading, error } = useSsdLocations();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1, borderColor: tintColor + '40' }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={tintColor} />
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedText type="title" style={styles.title}>SSD Token Counters</ThemedText>
          <ThemedText style={styles.subtitle}>Physical counter locations for free darshan tickets</ThemedText>
        </View>
      </View>

      {/* Info banner */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.bannerWrap}>
        <View style={[styles.infoBanner, { borderColor: tintColor + '44', backgroundColor: tintColor + '10' }]}>
          <View style={[styles.infoIconWrap, { backgroundColor: tintColor + '20' }]}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={17} color={tintColor} />
          </View>
          <ThemedText style={[styles.infoBannerText, { color: tintColor }]}>
            SSD Tokens are <ThemedText style={[styles.bold, { color: tintColor }]}>completely free</ThemedText>. Distributed on first-come-first-serve basis. Tokens run out fast - arrive early.
          </ThemedText>
        </View>
      </Animated.View>

      {/* Count pill */}
      <View style={styles.countWrap}>
        <View style={[styles.countPill, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
          <MaterialCommunityIcons name="map-marker-multiple-outline" size={13} color={tintColor} />
          <ThemedText style={[styles.countText, { color: tintColor }]}>
            {loading ? '...' : `${locations.length} counter locations`}
          </ThemedText>
        </View>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.centerStateText}>Loading locations...</ThemedText>
        </View>
      )}

      {/* Error state */}
      {!loading && error ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={tintColor} />
          <ThemedText style={styles.centerStateText}>Could not load locations</ThemedText>
        </View>
      ) : null}

      {/* Empty state */}
      {!loading && !error && locations.length === 0 ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={40} color={tintColor} />
          <ThemedText style={styles.centerStateText}>No locations available</ThemedText>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        {locations.map((loc, index) => (
          <Animated.View key={loc.id} entering={FadeInDown.delay(index * 80).duration(380)}>
            <View style={[styles.card, { borderColor: tintColor + '25' }]}>

              {/* Image with gradient overlay */}
              <View style={styles.imageWrap}>
                <Image
                  source={loc.image_url ? { uri: loc.image_url } : PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}
                  style={styles.cardImage}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.72)']}
                  style={styles.imageGradient}
                />

                {/* Tag badge */}
                {loc.tag ? (
                  <View style={[styles.tagBadge, { backgroundColor: tintColor }]}>
                    <ThemedText style={styles.tagText}>{loc.tag}</ThemedText>
                  </View>
                ) : null}

                {/* Location name on image */}
                <View style={styles.imageOverlayContent}>
                  <ThemedText style={styles.cardName}>{loc.name}</ThemedText>
                  <View style={styles.areaRow}>
                    <MaterialCommunityIcons name="map-marker" size={12} color="rgba(255,255,255,0.85)" />
                    <ThemedText style={styles.areaText}>{loc.area}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Card info rows */}
              <View style={styles.cardBody}>

                {/* Timings */}
                <View style={[styles.infoRow, { borderColor: tintColor + '20', backgroundColor: tintColor + '08' }]}>
                  <View style={[styles.infoRowIcon, { backgroundColor: tintColor + '20' }]}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={tintColor} />
                  </View>
                  <View style={styles.infoRowContent}>
                    <ThemedText style={styles.infoRowLabel}>Counter Timings</ThemedText>
                    <ThemedText style={[styles.infoRowValue, { color: tintColor }]}>{loc.timings}</ThemedText>
                  </View>
                </View>

                {/* Note */}
                {loc.note ? (
                  <View style={[styles.noteRow, { borderColor: '#f59e0b44', backgroundColor: '#f59e0b0E' }]}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#d97706" />
                    <ThemedText style={styles.noteText}>{loc.note}</ThemedText>
                  </View>
                ) : null}

                {/* Google Maps button */}
                <Pressable
                  onPress={() => Linking.openURL(loc.maps_url)}
                  style={({ pressed }) => [
                    styles.mapsBtn,
                    { borderColor: tintColor, backgroundColor: tintColor + '14', opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <MaterialCommunityIcons name="google-maps" size={16} color={tintColor} />
                  <ThemedText style={[styles.mapsBtnText, { color: tintColor }]}>Open in Google Maps</ThemedText>
                  <MaterialCommunityIcons name="open-in-new" size={12} color={tintColor + 'CC'} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    marginTop: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 3 },
  title: { fontSize: 21 },
  subtitle: { fontSize: 12.5, lineHeight: 18, opacity: 0.68 },
  bannerWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  bold: { fontWeight: '700' },
  countWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontSize: 11.5, fontWeight: '600' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  centerStateText: { fontSize: 14, opacity: 0.6, textAlign: 'center' },
  list: { paddingHorizontal: 16, gap: 16 },

  // Card
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // Image
  imageWrap: { position: 'relative', height: 170 },
  cardImage: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  imageOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 21,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  areaText: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', flex: 1 },

  // Card body
  cardBody: { padding: 12, gap: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowContent: { flex: 1, gap: 1 },
  infoRowLabel: { fontSize: 10.5, opacity: 0.6 },
  infoRowValue: { fontSize: 13, fontWeight: '600' },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, opacity: 0.85, marginTop: 0.5 },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  mapsBtnText: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'center' },
});