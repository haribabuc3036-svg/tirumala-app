import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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

function BookingListCard({ service }: { service: { id: string; title: string; icon: string; iconImage: string | null; bookingDate: string } }) {
  const cd = useCountdown(service.bookingDate);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const blocks: { value: number; label: string }[] = [
    { value: cd.days,    label: 'Days' },
    { value: cd.hours,   label: 'Hrs'  },
    { value: cd.minutes, label: 'Min'  },
    { value: cd.seconds, label: 'Sec'  },
  ];

  return (
    <LinearGradient
      colors={['#0f172a', '#1e1b4b', '#4c1d95']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
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
          <MaterialCommunityIcons name="rocket-launch-outline" size={16} color="#a78bfa" />
          <ThemedText style={{ color: '#a78bfa', fontSize: 13, fontWeight: '700' }}>Booking is now open!</ThemedText>
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
            <MaterialCommunityIcons name="clock-fast" size={20} color="#7c3aed" />
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
            <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#7c3aed55" />
            <ThemedText style={styles.emptyText}>No upcoming bookings scheduled.</ThemedText>
          </View>
        ) : (
          services.map((svc) => (
            <BookingListCard key={svc.id} service={svc} />
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
    backgroundColor: '#7c3aed18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed33',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7c3aed',
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
    shadowColor: '#4c1d95',
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
