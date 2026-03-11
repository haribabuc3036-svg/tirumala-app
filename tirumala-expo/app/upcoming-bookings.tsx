import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUpcomingBookings } from '@/hooks/use-upcoming-bookings';
import { resolveTtdIcon } from '@/constants/ttd-service-icons';

type Cd = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function getCountdown(isoDate: string): Cd {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
    expired: false,
  };
}

function useCountdown(isoDate: string) {
  const [cd, setCd] = useState<Cd>(() => getCountdown(isoDate));
  useEffect(() => {
    const timer = setInterval(() => {
      const next = getCountdown(isoDate);
      setCd(next);
      if (next.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [isoDate]);
  return cd;
}

// 10 distinct gradient palettes: [dark, mid, light], shadow = mid, accent = light
const CARD_PALETTES: { colors: [string, string, string]; shadow: string; accent: string }[] = [
  { colors: ['#062233', '#0A7EA4', '#29baea'], shadow: '#0A7EA4', accent: '#29baea' },  // teal
  { colors: ['#1a0533', '#7c3aed', '#a78bfa'], shadow: '#7c3aed', accent: '#a78bfa' },  // purple
  { colors: ['#2d0a14', '#be123c', '#f43f5e'], shadow: '#be123c', accent: '#f87171' },  // rose
  { colors: ['#0d1a2d', '#0369a1', '#38bdf8'], shadow: '#0369a1', accent: '#38bdf8' },  // sky-blue
  { colors: ['#022c1a', '#065f46', '#10b981'], shadow: '#065f46', accent: '#34d399' },  // emerald
  { colors: ['#2d1a00', '#b45309', '#f59e0b'], shadow: '#b45309', accent: '#fbbf24' },  // amber
  { colors: ['#2d0929', '#9d174d', '#ec4899'], shadow: '#9d174d', accent: '#f472b6' },  // pink
  { colors: ['#0d1033', '#3730a3', '#6366f1'], shadow: '#3730a3', accent: '#818cf8' },  // indigo
  { colors: ['#1a0533', '#7e22ce', '#d946ef'], shadow: '#7e22ce', accent: '#e879f9' },  // fuchsia
  { colors: ['#2d0e00', '#c2410c', '#fb923c'], shadow: '#c2410c', accent: '#fb923c' },  // orange
];

// Fisher-Yates shuffle of palette indices — evaluated once at module load
// so the order is random but stable for the lifetime of the screen.
const SHUFFLED_ORDER: number[] = (() => {
  const arr = Array.from({ length: CARD_PALETTES.length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
})();

// No palette repeats until all 10 have been shown
function pickPaletteIndex(cardIndex: number): number {
  return SHUFFLED_ORDER[cardIndex % CARD_PALETTES.length];
}

function BookingListCard({ service, cardIndex }: { service: { id: string; title: string; icon: string; iconImage: string | null; bookingDate: string }; cardIndex: number }) {
  const palette = CARD_PALETTES[pickPaletteIndex(cardIndex)];
  const cd = useCountdown(service.bookingDate);
  const router = useRouter();

  const blocks: { value: number; label: string }[] = [
    { value: cd.days,    label: 'Days' },
    { value: cd.hours,   label: 'Hrs'  },
    { value: cd.minutes, label: 'Min'  },
    { value: cd.seconds, label: 'Sec'  },
  ];

  return (
    <LinearGradient
      colors={palette.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { shadowColor: palette.shadow }]}>
      {/* decorative bubbles */}
      <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', opacity: 0.04, top: -30, right: -24 }} />
      <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', opacity: 0.05, bottom: -18, left: 16 }} />

      <View style={styles.cardHeader}>
        {/* icon */}
        <View style={styles.iconWrap}>
          {service.iconImage ? (
            <Image source={{ uri: service.iconImage }} style={styles.iconImage} contentFit="contain" />
          ) : (
            <MaterialCommunityIcons
              name={resolveTtdIcon(service.title, service.icon as any)}
              size={22}
              color="#fff"
            />
          )}
        </View>

        {/* title + date */}
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.cardTitle} numberOfLines={2}>{service.title}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MaterialCommunityIcons name="calendar-clock" size={11} color="rgba(255,255,255,0.55)" />
            <ThemedText style={styles.cardDate}>
              {new Date(service.bookingDate).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
                timeZone: 'Asia/Kolkata',
              })} IST
            </ThemedText>
          </View>
        </View>
      </View>

      {/* divider */}
      <View style={styles.divider} />

      {/* status label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <MaterialCommunityIcons
          name={cd.expired ? 'check-circle-outline' : 'alarm'}
          size={12}
          color="rgba(255,255,255,0.55)"
        />
        <ThemedText style={styles.statusLabel}>
          {cd.expired ? 'BOOKING IS OPEN' : 'BOOKING OPENS IN'}
        </ThemedText>
      </View>

      {/* countdown blocks */}
      {!cd.expired ? (
        <View style={styles.countdownRow}>
          {blocks.map(({ value, label }, i) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.cdBlock}>
                <ThemedText style={styles.cdValue}>{String(value).padStart(2, '0')}</ThemedText>
                <ThemedText style={styles.cdLabel}>{label}</ThemedText>
              </View>
              {i < blocks.length - 1 && (
                <ThemedText style={styles.cdSeparator}>:</ThemedText>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={16} color={palette.accent} />
          <ThemedText style={{ color: palette.accent, fontSize: 13, fontWeight: '700' }}>Booking is now open!</ThemedText>
        </View>
      )}

      {/* view details */}
      <Pressable
        style={({ pressed }) => [styles.viewBtn, { opacity: pressed ? 0.72 : 1 }]}
        onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
        <ThemedText style={styles.viewBtnText}>View Details</ThemedText>
        <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
      </Pressable>
    </LinearGradient>
  );
}

export default function UpcomingBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { services, loading } = useUpcomingBookings();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Upcoming Bookings' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <View style={styles.pageIconWrap}>
            <MaterialCommunityIcons name="clock-fast" size={20} color="#0A7EA4" />
          </View>
          <View>
            <ThemedText style={styles.pageTitle}>Upcoming Bookings</ThemedText>
            <ThemedText style={styles.pageSubtitle}>All services with scheduled booking dates</ThemedText>
          </View>
        </View>

        {loading ? (
          <ThemedText style={styles.metaText}>Loading...</ThemedText>
        ) : services.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#0A7EA455" />
            <ThemedText style={styles.emptyText}>No upcoming bookings scheduled.</ThemedText>
          </View>
        ) : (
          services.map((svc, idx) => (
            <BookingListCard key={svc.id} service={svc} cardIndex={idx} />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  pageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0A7EA418',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0A7EA433',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A7EA4',
  },
  pageSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 1,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    gap: 0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  iconImage: {
    width: 26,
    height: 26,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cdBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 52,
  },
  cdValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  cdLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  cdSeparator: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  viewBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  metaText: { fontSize: 13, opacity: 0.55, textAlign: 'center', marginTop: 32 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, opacity: 0.55, textAlign: 'center' },
});
