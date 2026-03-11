import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useServiceDetail } from '@/hooks/use-service-detail';

type Countdown = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function getCountdown(targetISO: string): Countdown {
  const now = Date.now();
  const target = new Date(targetISO).getTime();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

function useCountdown(targetISO: string | null) {
  const [cd, setCd] = useState<Countdown | null>(
    targetISO ? getCountdown(targetISO) : null
  );
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetISO) return;
    setCd(getCountdown(targetISO));
    ref.current = setInterval(() => {
      const next = getCountdown(targetISO);
      setCd(next);
      if (next.expired && ref.current) clearInterval(ref.current);
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [targetISO]);

  return cd;
}

// ── Pulsing ring animation around the alarm icon ────────────────────────
function PulseRing({ size, color }: { size: number; color: string }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    pulse(ring1, 0);
    pulse(ring2, 800);
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  });

  return (
    <>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
    </>
  );
}

// ── Segmented dot ring showing time-to-booking progress ────────────────
const DOT_RING_WINDOW_DAYS = 45;

function DotRing({ countdown, size = 56 }: { countdown: Countdown; size?: number; color: string }) {
  const dotCount = 40;
  const dotSize = 5;
  const radius = (size - dotSize * 2 - 2) / 2;
  const remaining =
    countdown.days * 86400 + countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  const total = DOT_RING_WINDOW_DAYS * 86400;
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2;
        const x = size / 2 + radius * Math.cos(angle) - dotSize / 2;
        const y = size / 2 + radius * Math.sin(angle) - dotSize / 2;
        const filled = i / dotCount <= progress;
        const hue = Math.round((i / dotCount) * 320 + 160);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: filled ? dotSize : dotSize - 1,
              height: filled ? dotSize : dotSize - 1,
              borderRadius: dotSize,
              backgroundColor: filled
                ? `hsl(${hue % 360}, 78%, 54%)`
                : 'rgba(150,150,150,0.18)',
              shadowColor: filled ? `hsl(${hue % 360}, 78%, 54%)` : 'transparent',
              shadowOpacity: filled ? 0.7 : 0,
              shadowRadius: filled ? 2 : 0,
              elevation: filled ? 2 : 0,
            }}
          />
        );
      })}
    </View>
  );
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const iconColor = Colors[colorScheme].icon;
  const cardBg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const buttonBackground = colorScheme === 'dark' ? Colors.light.tint : tintColor;
  const buttonTextColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const { service, loading, error } = useServiceDetail(id);

  const countdown = useCountdown(service?.bookingDate ?? null);
  const hasCountdown = !!countdown;
  const instructions = (service?.instructions && service.instructions.length > 0) ? service.instructions : null;

  const bookButtonScale = useRef(new Animated.Value(1)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 6, duration: 420, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.delay(800),
      ])
    ).start();
  }, []);

  const onBookNow = async () => {
    if (!service) return;
    const canOpen = await Linking.canOpenURL(service.url);
    if (!canOpen) { Alert.alert('Unable to open link', 'Please try again later.'); return; }
    await Linking.openURL(service.url);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title">Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!service) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title">Service not found</ThemedText>
        <ThemedText style={styles.emptyText}>{error ?? 'Please go back and select a valid service.'}</ThemedText>
      </ThemedView>
    );
  }

  const bookButton = (
    <Animated.View style={[styles.bookButtonWrapper, { transform: [{ scale: bookButtonScale }] }]}>
      <Pressable
        onPress={onBookNow}
        onPressIn={() =>
          Animated.spring(bookButtonScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start()
        }
        onPressOut={() =>
          Animated.spring(bookButtonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()
        }>
        <LinearGradient
          colors={['#29baea', buttonBackground, '#054d68']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bookButton}>
          {/* Decorative bubbles */}
          <View style={[styles.bubble, { width: 80, height: 80, top: -36, right: 20, opacity: 0.11 }]} />
          <View style={[styles.bubble, { width: 48, height: 48, bottom: -18, left: 24, opacity: 0.13 }]} />
          <View style={[styles.bubble, { width: 22, height: 22, top: 8, left: 18, opacity: 0.22 }]} />
          <View style={[styles.bubble, { width: 14, height: 14, bottom: 6, right: 64, opacity: 0.18 }]} />
          <View style={[styles.bubble, { width: 100, height: 100, top: -52, left: -28, opacity: 0.07 }]} />
          <View style={[styles.bubble, { width: 18, height: 18, top: 10, right: 42, opacity: 0.2 }]} />
          {/* Top shine strip */}
          <View style={styles.bookShine} />
          {/* Content */}
          <MaterialCommunityIcons name="calendar-check" size={20} color="#ffffff" />
          <ThemedText style={styles.bookText}>Check Availability</ThemedText>
          <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
            <MaterialCommunityIcons name="arrow-right-circle" size={18} color="rgba(255,255,255,0.7)" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: service.title }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: 36 }]}
        showsVerticalScrollIndicator={false}>

        {/* â”€â”€ Images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {service.images && service.images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}>
            {service.images.map((imageUrl, index) => (
              <Image
                key={`${service.id}-image-${index}`}
                source={{ uri: imageUrl }}
                style={styles.galleryImage}
                contentFit="cover"
                transition={180}
              />
            ))}
          </ScrollView>
        ) : (
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.image}
            contentFit="cover"
            transition={180}
          />
        )}

        {/* â”€â”€ Heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.titleRow}>
          <View style={[styles.iconBubble, { backgroundColor: tintColor + '1A' }]}>
            <MaterialCommunityIcons name={service.icon} size={24} color={tintColor} />
          </View>
          <View style={styles.titleCol}>
            <ThemedText type="title" style={styles.titleText}>{service.title}</ThemedText>
            {service.tag ? (
              <ThemedText style={[styles.tagText, { color: service.tagColor ?? iconColor }]}>
                {service.tag}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* â”€â”€ Countdown (if booking date exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {hasCountdown && countdown && !countdown.expired && (
          <View style={[styles.countdownCard, { borderColor: tintColor + '30', backgroundColor: tintColor + '0D' }]}>
            <View style={styles.countdownHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={styles.countdownIconArea}>
                  <PulseRing size={28} color={tintColor} />
                  <View style={[styles.countdownIconWrap, { backgroundColor: tintColor + '20' }]}>
                    <MaterialCommunityIcons name="alarm" size={15} color={tintColor} />
                  </View>
                </View>
                <ThemedText style={[styles.countdownLabel, { color: tintColor }]}>Booking Opens In</ThemedText>
              </View>
              <DotRing countdown={countdown} size={56} color={tintColor} />
            </View>
            <View style={styles.countdownBlocks}>
              {([
                { value: countdown.days,    label: 'Days' },
                { value: countdown.hours,   label: 'Hrs' },
                { value: countdown.minutes, label: 'Mins' },
                { value: countdown.seconds, label: 'Secs' },
              ] as { value: number; label: string }[]).map(({ value, label }, i, arr) => (
                <View key={label} style={styles.countdownBlockWrap}>
                  <View style={[styles.countdownBlock, { backgroundColor: tintColor + '18', borderColor: tintColor + '30' }]}>
                    <ThemedText style={[styles.countdownValue, { color: tintColor }]}>
                      {String(value).padStart(2, '0')}
                    </ThemedText>
                    <ThemedText style={styles.countdownUnit}>{label}</ThemedText>
                  </View>
                  {i < arr.length - 1 && (
                    <ThemedText style={[styles.countdownSep, { color: tintColor }]}>:</ThemedText>
                  )}
                </View>
              ))}
            </View>
            {service.bookingDate && (() => {
              const pillTextColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
              return (
                <View style={styles.countdownIndicatorRow}>
                  <LinearGradient
                    colors={['#0ea5e955', '#7c3aed38', '#ec489945']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.countdownIndicator, { borderColor: '#7c3aed45' }]}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={13} color={pillTextColor} />
                    <ThemedText style={[styles.countdownIndicatorText, { color: pillTextColor }]}>
                      {new Date(service.bookingDate!).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </ThemedText>
                  </LinearGradient>
                  <LinearGradient
                    colors={['#ec489945', '#7c3aed38', '#0ea5e955']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.countdownIndicator, { borderColor: '#7c3aed45' }]}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={13} color={pillTextColor} />
                    <ThemedText style={[styles.countdownIndicatorText, { color: pillTextColor }]}>
                      {new Date(service.bookingDate!).toLocaleString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true,
                        timeZone: 'Asia/Kolkata',
                      })} IST
                    </ThemedText>
                  </LinearGradient>
                </View>
              );
            })()}
          </View>
        )}

        {hasCountdown && countdown && countdown.expired &&
          Date.now() - new Date(service.bookingDate!).getTime() < 86_400_000 && (
          <LinearGradient
            colors={['#16a34a22', '#22c55e18', '#4ade8010']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bookingOpenBanner, { borderColor: '#22c55e40' }]}>
            {/* Decorative circles */}
            <View style={[styles.bookingOpenBlob1, { backgroundColor: '#22c55e12' }]} />
            <View style={[styles.bookingOpenBlob2, { backgroundColor: '#16a34a0e' }]} />

            <View style={[styles.bookingOpenIconWrap, { backgroundColor: '#22c55e22', borderColor: '#22c55e40' }]}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#16a34a" />
            </View>

            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.bookingOpenTitle, { color: '#16a34a' }]}>Booking is Now Open</ThemedText>
              <ThemedText style={[styles.bookingOpenSubtitle, { color: '#16a34a99' }]}>
                Slots available — book early to secure your spot
              </ThemedText>
            </View>

            <View style={[styles.bookingOpenLiveDot, { backgroundColor: '#22c55e' }]} />
          </LinearGradient>
        )}

        {/* â”€â”€ Book Now (after countdown if present) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {hasCountdown && bookButton}

        {/* â”€â”€ Description â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={[styles.section, { borderColor: tintColor + '20' }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="text-long" size={15} color={tintColor} />
            <ThemedText style={[styles.sectionTitle, { color: tintColor }]}>About</ThemedText>
          </View>
          <ThemedText style={styles.description}>{service.description}</ThemedText>
        </View>

        {/* â”€â”€ Book Now (no countdown â€” placed after description) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!hasCountdown && bookButton}

        {/* â”€â”€ Instructions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {instructions && instructions.length > 0 && (
          <View style={[styles.section, { borderColor: tintColor + '20' }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-list-checks" size={15} color={tintColor} />
              <ThemedText style={[styles.sectionTitle, { color: tintColor }]}>Instructions</ThemedText>
            </View>
            <View style={styles.instructionsList}>
              {instructions.map((item, i) => (
                <View key={i} style={styles.instructionRow}>
                  <View style={[styles.instructionBadge, { backgroundColor: tintColor + '1A' }]}>
                    <ThemedText style={[styles.instructionNum, { color: tintColor }]}>{i + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.instructionText}>{item}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },

  // Images
  image: { width: '100%', height: 200, borderRadius: 16 },
  galleryRow: { paddingRight: 6, gap: 10 },
  galleryImage: { width: 280, height: 200, borderRadius: 16 },

  // Heading
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  titleCol: { flex: 1, gap: 3 },
  titleText: { fontSize: 22, lineHeight: 28 },
  tagText: { fontSize: 13, fontWeight: '700' },

  // Countdown
  countdownCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  countdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdownIconArea: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  countdownIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countdownLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  countdownBlocks: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  countdownBlockWrap: { flexDirection: 'row', alignItems: 'center' },
  countdownBlock: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  countdownValue: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  countdownUnit: { fontSize: 10, fontWeight: '600', opacity: 0.65, marginTop: 2 },
  countdownSep: { fontSize: 22, fontWeight: '800', marginHorizontal: 6, marginBottom: 12 },
  countdownDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countdownDate: { fontSize: 12, opacity: 0.65 },
  countdownIndicatorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  countdownIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  countdownIndicatorText: { fontSize: 12, fontWeight: '600' },

  // Booking open banner
  bookingOpenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  bookingOpenBlob1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -20,
  },
  bookingOpenBlob2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -30,
    left: 10,
  },
  bookingOpenIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingOpenTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  bookingOpenSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3, lineHeight: 17 },
  bookingOpenLiveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  // Book button
  bookButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A7EA4',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  bookButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  bookShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
  },
  bookText: { fontSize: 16, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },

  // Shared section card
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  // Description
  description: { fontSize: 15, lineHeight: 23, opacity: 0.88 },

  // Instructions
  instructionsList: { gap: 10 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  instructionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  instructionNum: { fontSize: 11, fontWeight: '800' },
  instructionText: { flex: 1, fontSize: 13.5, lineHeight: 20, opacity: 0.88 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 8 },
  emptyText: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});
