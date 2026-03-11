import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { usePlaceDetail } from '@/hooks/use-place-detail';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.48);
const CARD_OVERLAP = 28; // how many px the card rises over the hero

export default function PlaceDetailScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = MainTabAccent.places;
  const isDark = colorScheme === 'dark';
  const textColor = Colors[colorScheme].text;
  const bgColor = Colors[colorScheme].background;
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
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
        <MaterialCommunityIcons name="map-outline" size={40} color={tintColor} style={{ marginBottom: 12 }} />
        <ThemedText type="title" style={{ textAlign: 'center' }}>
          {error ? 'Unable to load place' : 'Place not found'}
        </ThemedText>
        {error ? <ThemedText style={styles.emptySubtext}>{error}</ThemedText> : null}
        <Pressable onPress={() => router.back()} style={[styles.emptyBackBtn, { backgroundColor: tintColor }]}>
          <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
          <ThemedText style={styles.emptyBackText}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* â”€â”€ Fixed hero behind scroll â”€â”€ */}
      <View style={[styles.heroBg, { height: HERO_H }]}>
        {place?.photos[0] ? (
          <Image
            source={{ uri: place.photos[0] }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={280}
          />
        ) : (
          <LinearGradient colors={['#1a3a1a', '#2a5a2a', '#3d7a3d']} style={StyleSheet.absoluteFillObject} />
        )}
        {/* Scrim â€” top (for back btn) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.52)', 'transparent']}
          style={[styles.heroScrim, { height: 110 }]}
          pointerEvents="none"
        />
        {/* Scrim â€” bottom (bleeds into card) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.70)']}
          style={[styles.heroScrimBottom, { height: 160 }]}
          pointerEvents="none"
        />

        {/* Hero place name overlay */}
        {place ? (
          <Animated.View entering={FadeInUp.delay(120).duration(420)} style={[styles.heroOverlay, { bottom: CARD_OVERLAP + 18 }]}>
            <ThemedText style={styles.heroName} numberOfLines={2}>{place.name}</ThemedText>
            <View style={styles.heroTagsRow}>
              <View style={[styles.heroTag, { backgroundColor: tintColor }]}>
                <MaterialCommunityIcons name="map-marker-distance" size={11} color="#fff" />
                <ThemedText style={styles.heroTagText}>{place.distanceFromTirumalaKm} km from Tirumala</ThemedText>
              </View>
              {place.photos.length > 1 && (
                <View style={styles.heroTagDark}>
                  <MaterialCommunityIcons name="image-multiple-outline" size={11} color="rgba(255,255,255,0.88)" />
                  <ThemedText style={styles.heroTagDarkText}>{place.photos.length} photos</ThemedText>
                </View>
              )}
            </View>
          </Animated.View>
        ) : null}
      </View>

      {/* â”€â”€ Scrollable content card â”€â”€ */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Spacer to push card below hero */}
        <View style={{ height: HERO_H - CARD_OVERLAP }} />

        {/* Content card */}
        <Animated.View
          entering={FadeInUp.delay(60).duration(420)}
          style={[styles.card, { backgroundColor: bgColor, minHeight: SCREEN_H - (HERO_H - CARD_OVERLAP) }]}
        >
          {/* Card handle */}
          <View style={[styles.cardHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }]} />

          {/* Status boxes */}
          {loading ? (
            <View style={[styles.statusBox, { borderColor: tintColor + '40', backgroundColor: tintColor + '0A', margin: 16, marginBottom: 0 }]}>
              <MaterialCommunityIcons name="loading" size={14} color={tintColor} />
              <ThemedText style={[styles.statusText, { color: tintColor }]}>Loading place detailsâ€¦</ThemedText>
            </View>
          ) : null}
          {error ? (
            <View style={[styles.statusBox, { borderColor: '#FF6B6B44', backgroundColor: '#FF6B6B0D', margin: 16, marginBottom: 0 }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#FF6B6B" />
              <ThemedText style={styles.statusText}>{error}</ThemedText>
            </View>
          ) : null}

          {place ? (
            <View style={styles.cardBody}>

              {/* â”€â”€ Quick stats strip â”€â”€ */}
              <Animated.View entering={FadeIn.delay(180).duration(340)} style={[styles.statsStrip, { borderColor: cardBorder }]}>
                <View style={styles.statCell}>
                  <View style={[styles.statIcon, { backgroundColor: tintColor + '18' }]}>
                    <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={tintColor} />
                  </View>
                  <ThemedText style={[styles.statVal, { color: tintColor }]}>{place.distanceFromTirumalaKm}</ThemedText>
                  <ThemedText style={styles.statLbl}>km away</ThemedText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                <View style={styles.statCell}>
                  <View style={[styles.statIcon, { backgroundColor: tintColor + '18' }]}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={18} color={tintColor} />
                  </View>
                  <ThemedText style={[styles.statVal, { color: tintColor }]}>{place.photos.length}</ThemedText>
                  <ThemedText style={styles.statLbl}>photos</ThemedText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                <Pressable style={styles.statCell} onPress={openMaps}>
                  <View style={[styles.statIcon, { backgroundColor: tintColor + '18' }]}>
                    <MaterialCommunityIcons name="google-maps" size={18} color={tintColor} />
                  </View>
                  <ThemedText style={[styles.statVal, { color: tintColor }]}>Open</ThemedText>
                  <ThemedText style={styles.statLbl}>in Maps</ThemedText>
                </Pressable>
              </Animated.View>

              {/* â”€â”€ Gallery â”€â”€ */}
              {place.photos.length > 0 && (
                <Animated.View entering={FadeInDown.delay(220).duration(360)} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: tintColor }]} />
                    <ThemedText style={[styles.sectionTitle, { color: tintColor }]}>Gallery</ThemedText>
                    <ThemedText style={[styles.sectionBadge, { borderColor: tintColor + '40', color: tintColor }]}>
                      {place.photos.length}
                    </ThemedText>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoStrip}
                  >
                    {place.photos.map((photo, index) => (
                      <View key={`${place.id}-${index}`} style={[styles.photoThumb, index === 0 && styles.photoThumbFirst]}>
                        <Image source={{ uri: photo }} style={styles.photoImg} contentFit="cover" transition={200} />
                        {index === 0 && (
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.55)']}
                            style={styles.photoOverlay}
                          >
                            {/* <View style={[styles.photoCoverBadge, { backgroundColor: tintColor }]}> */}
                              {/* <ThemedText style={styles.photoCoverText}>Cover</ThemedText> */}
                            {/* </View> */}
                          </LinearGradient>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* â”€â”€ About â”€â”€ */}
              <Animated.View entering={FadeInDown.delay(280).duration(360)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: tintColor }]} />
                  <ThemedText style={[styles.sectionTitle, { color: tintColor }]}>About this place</ThemedText>
                </View>
                <View style={[styles.aboutCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: cardBorder }]}>
                  <ThemedText style={styles.aboutText}>{place.description}</ThemedText>
                </View>
              </Animated.View>

              {/* â”€â”€ Distance callout â”€â”€ */}
              <Animated.View entering={FadeInDown.delay(320).duration(360)}>
                <LinearGradient
                  colors={isDark ? [tintColor + '22', tintColor + '10'] : [tintColor + '14', tintColor + '08']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.distanceCallout, { borderColor: tintColor + '30' }]}
                >
                  <View style={[styles.distanceIconCircle, { backgroundColor: tintColor + '25' }]}>
                    <MaterialCommunityIcons name="map-marker-path" size={22} color={tintColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.distanceCalloutKm, { color: tintColor }]}>
                      {place.distanceFromTirumalaKm} km
                    </ThemedText>
                    <ThemedText style={styles.distanceCalloutSub}>
                      from Tirumala temple Â· directions available in Google Maps
                    </ThemedText>
                  </View>
                </LinearGradient>
              </Animated.View>

            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* â”€â”€ Floating back button â”€â”€ */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 10 }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
      </Pressable>

      {/* â”€â”€ Sticky bottom CTA â”€â”€ */}
      {place ? (
        <Animated.View
          entering={FadeInUp.delay(380).duration(340)}
          style={[
            styles.stickyFooter,
            {
              paddingBottom: insets.bottom + 14,
              backgroundColor: bgColor,
              borderColor: cardBorder,
            },
          ]}
        >
          <View style={styles.footerRow}>
            <View style={[styles.footerDistChip, { borderColor: tintColor + '38', backgroundColor: tintColor + '0E' }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={tintColor} />
              <ThemedText style={[styles.footerDistText, { color: tintColor }]}>
                {place.distanceFromTirumalaKm} km
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [styles.mapsBtn, { backgroundColor: tintColor, opacity: pressed ? 0.86 : 1 }]}
              onPress={openMaps}
            >
              <MaterialCommunityIcons name="google-maps" size={18} color="#fff" />
              <ThemedText style={styles.mapsBtnText}>Open in Google Maps</ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Hero (fixed background layer)
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroScrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  heroOverlay: { position: 'absolute', left: 16, right: 16, gap: 8 },
  heroName: { fontSize: 27, fontWeight: '900', color: '#fff', lineHeight: 33 },
  heroTagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroTagDark: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.44)' },
  heroTagDarkText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.88)' },
  // Back btn
  backBtn: {
    position: 'absolute', left: 14, zIndex: 30,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.44)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {},
  // Content card
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 500,
    // subtle shadow upward
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  cardBody: { paddingHorizontal: 16, paddingTop: 8, gap: 20, paddingBottom: 8 },
  // Status
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  statusText: { fontSize: 12, opacity: 0.82 },
  // Stats strip
  statsStrip: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal: { fontSize: 13, fontWeight: '800' },
  statLbl: { fontSize: 10, opacity: 0.55, fontWeight: '500' },
  statDivider: { width: 1 },
  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, flex: 1 },
  sectionBadge: { fontSize: 11, fontWeight: '700', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  // Gallery
  photoStrip: { gap: 10, paddingRight: 4 },
  photoThumb: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  photoThumbFirst: {},
  photoImg: { width: 200, height: 134 },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 8 },
  photoCoverBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  photoCoverText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  // About
  aboutCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  aboutText: { fontSize: 15, lineHeight: 25, opacity: 0.87 },
  // Distance callout
  distanceCallout: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  distanceIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  distanceCalloutKm: { fontSize: 18, fontWeight: '900' },
  distanceCalloutSub: { fontSize: 12, opacity: 0.65, lineHeight: 17, marginTop: 1 },
  // Sticky footer
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 14, paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerDistChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  footerDistText: { fontSize: 13, fontWeight: '700' },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13,
  },
  mapsBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  emptySubtext: { fontSize: 13, opacity: 0.65, marginTop: 6, textAlign: 'center' },
  emptyBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginTop: 18 },
  emptyBackText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
