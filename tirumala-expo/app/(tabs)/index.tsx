import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resolveTtdIcon } from '@/constants/ttd-service-icons';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLiveUpdates, type LiveLatestUpdateItem } from '@/hooks/use-live-updates';
import { useServicesCatalog } from '@/hooks/use-services-catalog';
import { useHelpContent } from '@/hooks/use-help-content';
import { useUpcomingBookings, type UpcomingBookingService } from '@/hooks/use-upcoming-bookings';
import { type Service } from '@/types/services';

type HomeTab = 'overview' | 'explore' | 'help';

type LatestNewsItem = {
  date: string;
  image_url: string;
  link: string;
  title: string;
};

type OverviewServiceItem = Service & {
  categoryHeading: string;
};

function UpdateSlideCard({
  item,
  index,
  total,
  activeAccent,
  slideWidth,
}: {
  item: LiveLatestUpdateItem;
  index: number;
  total: number;
  activeAccent: string;
  slideWidth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  // Extract URL: prefer item.link, fallback to first URL found in text
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const extractedUrl = item.link || (item.text.match(urlRegex)?.[0] ?? null);
  // Strip raw URLs from displayed text, then split around "click here"
  const cleanText = item.text.replace(urlRegex, '').replace(/\s{2,}/g, ' ').trim();
  const clickHereRegex = /(click\s+here)/i;
  const textParts = cleanText.split(clickHereRegex);
  const hasClickHere = textParts.length > 1;

  return (
    <View
      style={[
        updateSlideCardStyle,
        {
          width: slideWidth,
          borderColor: activeAccent + '33',
          backgroundColor: activeAccent + '0A',
        },
      ]}>
      <View style={updateSlideHeaderStyle}>
        <View style={[updateSlideBadgeStyle, { backgroundColor: activeAccent + '20' }]}>
          <MaterialCommunityIcons name="bell-outline" size={12} color={activeAccent} />
          <ThemedText style={[updateSlideBadgeTextStyle, { color: activeAccent }]}>
            UPDATE {index + 1} / {total}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        style={updateSlideTextStyle}
        numberOfLines={expanded ? undefined : 10}
        onTextLayout={(e) => {
          if (!expanded && e.nativeEvent.lines.length >= 10) setIsTruncated(true);
        }}>
        {hasClickHere
          ? textParts.map((part, i) =>
              clickHereRegex.test(part) ? (
                <ThemedText
                  key={i}
                  onPress={extractedUrl ? () => Linking.openURL(extractedUrl) : undefined}
                  style={[
                    updateSlideTextStyle,
                    {
                      color: activeAccent,
                      fontWeight: '700',
                      textDecorationLine: 'underline',
                    },
                  ]}>
                  {part}
                </ThemedText>
              ) : (
                <ThemedText key={i} style={updateSlideTextStyle}>{part}</ThemedText>
              )
            )
          : cleanText}
      </ThemedText>
      {!hasClickHere && extractedUrl && (
        <Pressable
          onPress={() => Linking.openURL(extractedUrl)}
          style={[updateClickHereBtnStyle, { backgroundColor: activeAccent + '18', borderColor: activeAccent + '44' }]}>
          <MaterialCommunityIcons name="open-in-new" size={11} color={activeAccent} />
          <ThemedText style={[updateClickHereTextStyle, { color: activeAccent }]}>Click Here</ThemedText>
        </Pressable>
      )}
      {(isTruncated || expanded) && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <ThemedText style={[updateReadMoreStyle, { color: activeAccent }]}>
            {expanded ? 'Read Less ↑' : 'Read More ↓'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function SsdLiveButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const ringAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.timing(ringAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
    ).start();
  }, [pulseAnim, ringAnim]);

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.15, 0] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ssdBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#1ac8f5', '#0A7EA4', '#065c78']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        {/* Left icon + text */}
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>SSD Token</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>Tap to view live availability</ThemedText>
          </View>
        </View>

        {/* Live dot with ring */}
        <View style={ssdBtnRight}>
          <View style={ssdLiveDotWrap}>
            <RNAnimated.View
              style={[
                ssdLiveRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <RNAnimated.View style={[ssdLiveDot, { opacity: pulseAnim }]} />
          </View>
          <ThemedText style={ssdLiveLabel}>LIVE</ThemedText>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const ssdBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#0A7EA4',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
  elevation: 8,
};
const ssdBtnGradient: import('react-native').ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 18,
  paddingVertical: 16,
  paddingHorizontal: 18,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
};
const ssdBtnLeft: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 };
const ssdBtnIconWrap: import('react-native').ViewStyle = {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: 'rgba(255,255,255,0.18)',
  alignItems: 'center',
  justifyContent: 'center',
};
const ssdBtnTitle: import('react-native').TextStyle = { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.2 };
const ssdBtnSubtitle: import('react-native').TextStyle = { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 };
const ssdBtnRight: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 6 };
const ssdLiveDotWrap: import('react-native').ViewStyle = { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' };
const ssdLiveRing: import('react-native').ViewStyle = {
  position: 'absolute',
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: '#4ade80',
};
const ssdLiveDot: import('react-native').ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#4ade80',
};
const ssdLiveLabel: import('react-native').TextStyle = { fontSize: 10, fontWeight: '800', color: '#4ade80', letterSpacing: 1 };

function PilgrimUpdatesButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pilgrimBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#f97316', '#c2410c', '#7c2d12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Pilgrim Updates</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>Tap to view today's crowd &amp; darshan</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const pilgrimBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#f97316',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

function DayScheduleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [scheduleBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#a855f7', '#7c3aed', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Day Schedules</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>Tap to view today's seva timings</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const scheduleBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#7c3aed',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

function DarshanNewsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [darshanNewsBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#9b8ff5', '#7B68EE', '#4c3dbd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Open Darshan News</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>SSD, pilgrims, schedules & more</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const darshanNewsBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#7B68EE',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

function FaqList({ items, accentColor }: { items: { id: number; question: string; answer: string }[]; accentColor: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = useCallback((id: number) => setExpanded((prev) => (prev === id ? null : id)), []);
  if (items.length === 0) return <ThemedText style={[faqAnswerText, { marginTop: 4 }]}>No FAQs available.</ThemedText>;
  return (
    <View style={faqListWrap}>
      {items.map((item) => (
        <View key={item.id} style={[faqItemWrap, { borderColor: accentColor + '30' }]}>
          <Pressable
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [faqQuestion, { opacity: pressed ? 0.75 : 1 }]}>
            <ThemedText style={[faqQuestionText, { color: accentColor }]}>{item.question}</ThemedText>
            <MaterialCommunityIcons
              name={expanded === item.id ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={accentColor}
            />
          </Pressable>
          {expanded === item.id ? (
            <View style={[faqAnswerWrap, { borderTopColor: accentColor + '20' }]}>
              <ThemedText style={faqAnswerText}>{item.answer}</ThemedText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const faqListWrap: import('react-native').ViewStyle = { gap: 8, marginTop: 4 };
const faqItemWrap: import('react-native').ViewStyle = { borderWidth: 1, borderRadius: 10, overflow: 'hidden' };
const faqQuestion: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 8 };
const faqQuestionText: import('react-native').TextStyle = { fontSize: 12.5, fontWeight: '600', flex: 1, lineHeight: 18 };
const faqAnswerWrap: import('react-native').ViewStyle = { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1 };
const faqAnswerText: import('react-native').TextStyle = { fontSize: 12, lineHeight: 18, opacity: 0.82, marginTop: 8 };

function CounterLocationsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [counterBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#1ac8f5', '#0A7EA4', '#065c78']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="map-marker-multiple-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Free Ticket Counters</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>Tap to view physical counter locations</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const counterBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#0A7EA4',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

// Flat style refs for UpdateSlideCard (defined outside main component to avoid re-creation)
const updateSlideCardStyle: import('react-native').ViewStyle = { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 };
const updateSlideHeaderStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center' };
const updateSlideBadgeStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 };
const updateSlideBadgeTextStyle: import('react-native').TextStyle = { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4 };
const updateSlideTextStyle: import('react-native').TextStyle = { fontSize: 12, lineHeight: 18.5, opacity: 0.88 };
const updateClickHereBtnStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 };
const updateClickHereTextStyle: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700' };
const updateReadMoreStyle: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700', marginTop: 2 };

// ── Upcoming booking countdown helpers ────────────────────────────────────
type BookingCd = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function getBookingCountdown(isoDate: string): BookingCd {
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

function BookingCountdownCard({
  service,
  cardWidth,
}: {
  service: UpcomingBookingService;
  cardWidth: number;
}) {
  const [cd, setCd] = useState<BookingCd>(() => getBookingCountdown(service.bookingDate));
  useEffect(() => {
    const timer = setInterval(() => {
      const next = getBookingCountdown(service.bookingDate);
      setCd(next);
      if (next.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [service.bookingDate]);

  const blocks: { value: number; label: string }[] = [
    { value: cd.days,    label: 'Days' },
    { value: cd.hours,   label: 'Hrs'  },
    { value: cd.minutes, label: 'Mins' },
    { value: cd.seconds, label: 'Secs' },
  ];

  return (
    <LinearGradient
      colors={['#0f172a', '#1e1b4b', '#4c1d95']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[bookingCardBaseStyle, { width: cardWidth }]}>
      {/* decorative bubbles */}
      <View style={{ position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', opacity: 0.04, top: -24, right: -20 }} />
      <View style={{ position: 'absolute', width: 55, height: 55, borderRadius: 28, backgroundColor: '#fff', opacity: 0.05, bottom: -14, left: 12 }} />
      <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', opacity: 0.09, top: 14, right: 40 }} />

      {/* title */}
      <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 18 }} numberOfLines={2}>
        {service.title}
      </ThemedText>

      {/* label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <MaterialCommunityIcons name="alarm" size={12} color="rgba(255,255,255,0.55)" />
        <ThemedText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3 }}>
          BOOKING OPENS IN
        </ThemedText>
      </View>

      {/* countdown blocks */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        {blocks.map(({ value, label }, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 6, minWidth: 40 }}>
              <ThemedText style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 24 }}>
                {String(value).padStart(2, '0')}
              </ThemedText>
              <ThemedText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600', marginTop: 1 }}>
                {label}
              </ThemedText>
            </View>
            {i < blocks.length - 1 && (
              <ThemedText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: '800', marginHorizontal: 3, marginBottom: 10 }}>:</ThemedText>
            )}
          </View>
        ))}
      </View>

      {/* date */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
        <MaterialCommunityIcons name="calendar-clock" size={12} color="rgba(255,255,255,0.6)" />
        <ThemedText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
          {new Date(service.bookingDate).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
            timeZone: 'Asia/Kolkata',
          })} IST
        </ThemedText>
      </View>

      {/* view details */}
      <Pressable
        style={({ pressed }) => ({
          marginTop: 14,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderRadius: 10,
          paddingVertical: 9,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: 6,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
          opacity: pressed ? 0.72 : 1,
        })}
        onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
        <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>View Details</ThemedText>
        <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
      </Pressable>
    </LinearGradient>
  );
}

const bookingCardBaseStyle: import('react-native').ViewStyle = {
  borderRadius: 16,
  padding: 14,
  overflow: 'hidden',
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = MainTabAccent.index;
  const borderColor = Colors[colorScheme].icon;
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<HomeTab>('overview');
  const [activeNewsSlide, setActiveNewsSlide] = useState(0);
  const [activeUpdateSlide, setActiveUpdateSlide] = useState(0);
  const { latestNews, latestUpdates, loading: liveLoading } = useLiveUpdates();
  const { overviewServices, loading: servicesLoading, error: servicesError } = useServicesCatalog();
  const { content: helpContent, loading: helpLoading } = useHelpContent();
  const overviewServiceItems: OverviewServiceItem[] = overviewServices;
  const { services: upcomingBookings } = useUpcomingBookings(3);
  const bookingCardWidth = upcomingBookings.length === 1 ? screenWidth - 48 : screenWidth - 48 - 20;

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    help: tintColor,
  };
  const activeAccent = accentByTab[activeTab];
  const newsItems: LatestNewsItem[] = latestNews;
  const previewNewsItems = newsItems.slice(0, 4);
  const newsSlideWidth = previewNewsItems.length > 1
    ? Math.max(240, screenWidth - 52 - 28)
    : Math.max(260, screenWidth - 52);
  const updateSlideWidth = latestUpdates.length > 1
    ? Math.max(240, screenWidth - 52 - 28)
    : Math.max(260, screenWidth - 52);

  useEffect(() => {
    if (activeNewsSlide >= previewNewsItems.length) {
      setActiveNewsSlide(0);
    }
  }, [activeNewsSlide, previewNewsItems.length]);

  const buildProxyUrl = (sourceUrl: string) => {
    return `https://images.weserv.nl/?url=${encodeURIComponent(sourceUrl)}&w=1200&output=jpg`;
  };

  const handleNewsScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / (newsSlideWidth + 8));
    const clampedIndex = Math.max(0, Math.min(rawIndex, previewNewsItems.length - 1));
    setActiveNewsSlide(clampedIndex);
  };

  const handleUpdateScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / (updateSlideWidth + 8));
    const clampedIndex = Math.max(0, Math.min(rawIndex, latestUpdates.length - 1));
    setActiveUpdateSlide(clampedIndex);
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <View style={styles.overviewWrap}>
          <Animated.View entering={FadeInDown.duration(320)} style={styles.bannerWrap}>
            <Image
              source={require('../../assets/images/banner-image.png')}
              style={styles.bannerImage}
              contentFit="cover"
              contentPosition="center"
              transition={200}
            />
          </Animated.View>

          <ThemedView style={[styles.contentCard, styles.overviewServicesCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
            {/* ── Opening Soon carousel ── */}
            {upcomingBookings.length > 0 ? (
              <>
                <View style={styles.newsHeaderTitleWrap}>
                  <View style={[styles.newsHeaderIconWrap, { backgroundColor: '#7c3aed22' }]}>
                    <MaterialCommunityIcons name="clock-fast" size={14} color="#7c3aed" />
                  </View>
                  <View>
                    <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: '#7c3aed' }]}>Opening Soon</ThemedText>
                    <ThemedText style={styles.latestNewsSubtitle}>Booking opens within 3 days</ThemedText>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  pagingEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={bookingCardWidth + 10}
                  decelerationRate="fast"
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                  {upcomingBookings.map((svc) => (
                    <BookingCountdownCard key={svc.id} service={svc} cardWidth={bookingCardWidth} />
                  ))}
                </ScrollView>
                <View style={[styles.bookingCarouselDivider, { backgroundColor: activeAccent + '25' }]} />
              </>
            ) : null}

            <View style={styles.overviewServicesHeader}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="apps" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Quick Services</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>From live services catalog</ThemedText>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/services')}
                style={({ pressed }) => [
                  styles.viewMoreBtn,
                  { borderColor: activeAccent, backgroundColor: activeAccent + '14', opacity: pressed ? 0.78 : 1 },
                ]}>
                <ThemedText style={[styles.viewMoreText, { color: activeAccent }]}>View All</ThemedText>
              </Pressable>
            </View>

            {servicesLoading ? <ThemedText style={styles.newsDate}>Loading services...</ThemedText> : null}
            {!servicesLoading && servicesError ? <ThemedText style={styles.newsDate}>Unable to load services.</ThemedText> : null}
            {!servicesLoading && !servicesError && overviewServiceItems.length === 0 ? (
              <ThemedText style={styles.newsDate}>No services available.</ThemedText>
            ) : null}

            {!servicesLoading && !servicesError && overviewServiceItems.length > 0 ? (
              <View style={styles.overviewServicesGrid}>
                {overviewServiceItems.map((service, index) => {
                  const isLastInRow = (index + 1) % 2 === 0;

                  return (
                    <Pressable
                      key={service.id}
                      style={({ pressed }) => [
                        styles.overviewServiceItem,
                        {
                          marginRight: isLastInRow ? 0 : '4%',
                          borderColor: activeAccent + '2A',
                          backgroundColor: activeAccent + '14',
                          opacity: pressed ? 0.78 : 1,
                        },
                      ]}
                      onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
                      <View style={[styles.overviewServiceIconWrap, { backgroundColor: activeAccent + '20' }]}>
                        {service.iconImage ? (
                          <Image source={{ uri: service.iconImage }} style={styles.overviewServiceImage} contentFit="contain" />
                        ) : (
                          <MaterialCommunityIcons
                            name={resolveTtdIcon(service.title, service.icon)}
                            size={16}
                            color={activeAccent}
                          />
                        )}
                      </View>

                      <ThemedText style={styles.overviewServiceTitle} numberOfLines={2}>{service.title}</ThemedText>
                      <ThemedText style={styles.overviewServiceCategory} numberOfLines={1}>{service.categoryHeading}</ThemedText>
                      {service.tag ? (
                        <View style={[styles.overviewServiceTagPill, { backgroundColor: (service.tagColor ?? activeAccent) + '22' }]}>
                          <ThemedText style={[styles.overviewServiceTagText, { color: service.tagColor ?? activeAccent }]}>
                            {service.tag}
                          </ThemedText>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </ThemedView>

          <ThemedView style={[styles.contentCard, styles.overviewServicesCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <View style={styles.overviewServicesHeader}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Latest Darshan/Seva Updates</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>
                    {liveLoading ? 'Loading...' : latestUpdates.length > 0 ? `${latestUpdates.length} official update(s)` : 'No updates available'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {!liveLoading && latestUpdates.length > 0 ? (
              <View style={styles.newsListWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={updateSlideWidth + 8}
                  onMomentumScrollEnd={handleUpdateScrollEnd}
                  contentContainerStyle={styles.newsCarouselContent}>
                  {latestUpdates.map((item, index) => (
                    <UpdateSlideCard
                      key={`update-${index}`}
                      item={item}
                      index={index}
                      total={latestUpdates.length}
                      activeAccent={activeAccent}
                      slideWidth={updateSlideWidth}
                    />
                  ))}
                </ScrollView>

                {latestUpdates.length > 1 ? (
                  <View style={styles.newsPaginationWrap}>
                    {latestUpdates.map((_, index) => {
                      const isActive = index === activeUpdateSlide;
                      return (
                        <View
                          key={`update-dot-${index}`}
                          style={[
                            styles.newsPaginationDot,
                            isActive
                              ? { width: 18, backgroundColor: activeAccent, borderColor: activeAccent }
                              : { backgroundColor: activeAccent + '22', borderColor: activeAccent + '55' },
                          ]}
                        />
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}
          </ThemedView>

          <View style={styles.overviewQuickLinksWrap}>

            {/* ── Free Tickets ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  source={require('../../assets/images/banner-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(26,200,245,0.82)', 'rgba(10,126,164,0.90)', 'rgba(6,92,120,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Free Tickets</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>SSD Token & counter locations</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              {/* TODO: replace with your own free-tickets section image */}
              <Image
                source={require('../../assets/images/banner-image.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <SsdLiveButton onPress={() => router.push({ pathname: '/(tabs)/news', params: { tab: 'ssd' } })} />
                <CounterLocationsButton onPress={() => router.push('/ssd-locations')} />
              </View>
            </View>

            {/* ── Pilgrim Updates ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  source={require('../../assets/images/explore-hero-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(249,115,22,0.82)', 'rgba(234,88,12,0.90)', 'rgba(194,65,12,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="account-group-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Pilgrim Updates</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>Today's crowd, darshan & hundi</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              {/* TODO: replace with your own pilgrim-updates section image */}
              <Image
                source={require('../../assets/images/explore-hero-image.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <PilgrimUpdatesButton onPress={() => router.push({ pathname: '/(tabs)/news', params: { tab: 'pilgrims' } })} />
              </View>
            </View>

            {/* ── Today Schedules ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  source={require('../../assets/images/support-hero-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(168,85,247,0.82)', 'rgba(147,51,234,0.90)', 'rgba(124,58,237,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="calendar-clock-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Today Schedules</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>Seva & darshan timings for today</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              {/* TODO: replace with your own schedules section image */}
              <Image
                source={require('../../assets/images/support-hero-image.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <DayScheduleButton onPress={() => router.push({ pathname: '/(tabs)/news', params: { tab: 'schedule' } })} />
              </View>
            </View>

          </View>
        </View>
      );
    }

    if (activeTab === 'explore') {
      return (
        <View style={styles.overviewWrap}>
          <Animated.View entering={FadeInDown.duration(320)} style={styles.bannerWrap}>
            <Image
              source={require('../../assets/images/explore-hero-image.png')}
              style={styles.bannerImage}
              contentFit="cover"
              contentPosition="center"
              transition={200}
            />
          </Animated.View>

          <ThemedView style={[styles.contentCard, styles.premiumNewsCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
            <View style={styles.newsHeaderRow}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Latest News</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>Swipe to explore recent updates</ThemedText>
                </View>
              </View>
              {!liveLoading && newsItems.length > 0 ? (
                <Pressable
                  onPress={() => router.push('/latest-news')}
                  style={({ pressed }) => [
                    styles.viewMoreBtn,
                    { borderColor: activeAccent, backgroundColor: activeAccent + '14', opacity: pressed ? 0.78 : 1 },
                  ]}>
                  <ThemedText style={[styles.viewMoreText, { color: activeAccent }]}>View More</ThemedText>
                </Pressable>
              ) : null}
            </View>

            {liveLoading ? <ThemedText style={styles.newsDate}>Loading latest news...</ThemedText> : null}
            {!liveLoading && newsItems.length === 0 ? <ThemedText style={styles.newsDate}>No latest news available.</ThemedText> : null}
            {!liveLoading && previewNewsItems.length > 0 ? (
              <View style={styles.newsListWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={newsSlideWidth + 8}
                  onMomentumScrollEnd={handleNewsScrollEnd}
                  contentContainerStyle={styles.newsCarouselContent}>
                  {previewNewsItems.map((item) => (
                    <View
                      key={`${item.date}-${item.link}`}
                      style={[
                        styles.newsItem,
                        {
                          width: newsSlideWidth,
                          borderColor: activeAccent + '33',
                          backgroundColor: activeAccent + '0A',
                        },
                      ]}> 
                      <Image
                        source={
                          item.image_url?.trim()
                            ? { uri: buildProxyUrl(item.image_url.trim()) }
                            : require('../../assets/images/banner-image.png')
                        }
                        style={styles.newsImage}
                        contentFit="cover"
                        transition={180}
                      />

                      <View style={styles.newsTextWrap}>
                        <ThemedText style={styles.newsTitle} numberOfLines={3}>{item.title}</ThemedText>

                        <Pressable
                          onPress={() => void Linking.openURL(item.link)}
                          style={({ pressed }) => [
                            styles.viewDetailsBtn,
                            { borderColor: activeAccent, backgroundColor: activeAccent + '14', opacity: pressed ? 0.78 : 1 },
                          ]}>
                          <ThemedText style={[styles.viewDetailsText, { color: activeAccent }]}>View Details</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {previewNewsItems.length > 1 ? (
                  <View style={styles.newsPaginationWrap}>
                    {previewNewsItems.map((item, index) => {
                      const isActive = index === activeNewsSlide;

                      return (
                        <View
                          key={`${item.date}-${item.link}-dot`}
                          style={[
                            styles.newsPaginationDot,
                            isActive
                              ? { width: 18, backgroundColor: activeAccent, borderColor: activeAccent }
                              : { backgroundColor: activeAccent + '22', borderColor: activeAccent + '55' },
                          ]}
                        />
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}
          </ThemedView>

          {/* ── Darshan News section card ── */}
          <View style={styles.overviewQuickLinksWrap}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  source={require('../../assets/images/banner-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(123,104,238,0.82)', 'rgba(100,80,220,0.90)', 'rgba(72,52,180,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="newspaper-variant-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Darshan News</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>SSD, pilgrims, schedules & the latest</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.sectionBtnsWrap}>
                <DarshanNewsButton onPress={() => router.push('/(tabs)/news')} />
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.overviewWrap}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.bannerWrap}>
          <Image
            source={require('../../assets/images/support-hero-image.png')}
            style={styles.bannerImage}
            contentFit="cover"
            contentPosition="center"
            transition={200}
          />
        </Animated.View>

        {helpLoading ? (
          <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <ThemedText style={styles.latestNewsSubtitle}>Loading help content…</ThemedText>
          </ThemedView>
        ) : null}

        {/* ── Dress Code ── */}
        {!helpLoading ? (
          <ThemedView style={[styles.contentCard, styles.premiumNewsCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <View style={styles.newsHeaderRow}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="tshirt-crew-outline" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Dress Code</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>What to wear at Tirumala</ThemedText>
                </View>
              </View>
            </View>

            {(['men', 'women', 'general'] as const).map((section) => {
              const items = helpContent.dressCode[section];
              if (items.length === 0) return null;
              const sectionLabel = section === 'men' ? 'Men' : section === 'women' ? 'Women' : 'General';
              const sectionIcon = section === 'men' ? 'human-male' : section === 'women' ? 'human-female' : 'information-outline';
              return (
                <View key={section} style={[dressSectionWrap, { borderColor: activeAccent + '20' }]}>
                  <View style={[dressSectionHeader, { backgroundColor: activeAccent + '15' }]}>
                    <MaterialCommunityIcons name={sectionIcon as any} size={13} color={activeAccent} />
                    <ThemedText style={[dressSectionTitle, { color: activeAccent }]}>{sectionLabel}</ThemedText>
                  </View>
                  {items.map((item) => (
                    <View key={item.id} style={dressItemRow}>
                      <View style={[dressBullet, { backgroundColor: activeAccent }]} />
                      <ThemedText style={dressItemText}>{item.content}</ThemedText>
                    </View>
                  ))}
                </View>
              );
            })}
          </ThemedView>
        ) : null}

        {/* ── Do's & Don'ts ── */}
        {!helpLoading ? (
          <ThemedView style={[styles.contentCard, styles.premiumNewsCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <View style={styles.newsHeaderRow}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Do's & Don'ts</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>Tips for a smooth pilgrimage</ThemedText>
                </View>
              </View>
            </View>

            <View style={dosDontsGrid}>
              {/* Do's column */}
              <View style={dosDontsColumn}>
                <View style={[dosDontsColHeader, { backgroundColor: '#16a34a18' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={13} color="#16a34a" />
                  <ThemedText style={[dosDontsColTitle, { color: '#16a34a' }]}>Do's</ThemedText>
                </View>
                {helpContent.dos.map((item) => (
                  <View key={item.id} style={dosDontsItemRow}>
                    <MaterialCommunityIcons name="check" size={12} color="#16a34a" style={{ marginTop: 2 }} />
                    <ThemedText style={dosDontsItemText}>{item.content}</ThemedText>
                  </View>
                ))}
                {helpContent.dos.length === 0 ? <ThemedText style={dosDontsItemText}>No items.</ThemedText> : null}
              </View>

              {/* Don'ts column */}
              <View style={dosDontsColumn}>
                <View style={[dosDontsColHeader, { backgroundColor: '#dc262618' }]}>
                  <MaterialCommunityIcons name="close-circle-outline" size={13} color="#dc2626" />
                  <ThemedText style={[dosDontsColTitle, { color: '#dc2626' }]}>Don'ts</ThemedText>
                </View>
                {helpContent.donts.map((item) => (
                  <View key={item.id} style={dosDontsItemRow}>
                    <MaterialCommunityIcons name="close" size={12} color="#dc2626" style={{ marginTop: 2 }} />
                    <ThemedText style={dosDontsItemText}>{item.content}</ThemedText>
                  </View>
                ))}
                {helpContent.donts.length === 0 ? <ThemedText style={dosDontsItemText}>No items.</ThemedText> : null}
              </View>
            </View>
          </ThemedView>
        ) : null}

        {/* ── FAQs ── */}
        {!helpLoading ? (
          <ThemedView style={[styles.contentCard, styles.premiumNewsCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <View style={styles.newsHeaderRow}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="frequently-asked-questions" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>FAQs</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>Common questions answered</ThemedText>
                </View>
              </View>
            </View>
            <FaqList items={helpContent.faqs} accentColor={activeAccent} />
          </ThemedView>
        ) : null}

        {/* ── Contact & Support ── */}
        {!helpLoading ? (
          <ThemedView style={[styles.contentCard, styles.premiumNewsCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}>
            <View style={styles.newsHeaderRow}>
              <View style={styles.newsHeaderTitleWrap}>
                <View style={[styles.newsHeaderIconWrap, { backgroundColor: activeAccent + '20' }]}>
                  <MaterialCommunityIcons name="headset" size={14} color={activeAccent} />
                </View>
                <View>
                  <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Contact & Support</ThemedText>
                  <ThemedText style={styles.latestNewsSubtitle}>Reach TTD directly</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.supportLinksWrap}>
              {helpContent.contactSupport.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => Linking.openURL(item.url)}
                  style={({ pressed }) => [
                    styles.supportLinkBtn,
                    { borderColor: activeAccent + '40', backgroundColor: activeAccent + '10', opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <View style={[styles.supportLinkIcon, { backgroundColor: activeAccent + '20' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={16} color={activeAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.supportLinkLabel, { color: activeAccent }]}>{item.label}</ThemedText>
                    <ThemedText style={styles.supportLinkSub}>{item.sub_label}</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="open-in-new" size={13} color={activeAccent + 'AA'} />
                </Pressable>
              ))}
              {helpContent.contactSupport.length === 0 ? (
                <ThemedText style={styles.newsDate}>No contact info available.</ThemedText>
              ) : null}
            </View>
          </ThemedView>
        ) : null}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <View style={styles.titleRow}>
          <ThemedText type="title">Home</ThemedText>
        </View>
      </View>

      <View style={[styles.fixedTabsWrap, { borderColor }]}> 
        <HomeTabButton
          label="Overview"
          active={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
          tintColor={accentByTab.overview}
        />
        <HomeTabButton
          label="Explore"
          active={activeTab === 'explore'}
          onPress={() => setActiveTab('explore')}
          tintColor={accentByTab.explore}
        />
        <HomeTabButton
          label="Help"
          active={activeTab === 'help'}
          onPress={() => setActiveTab('help')}
          tintColor={accentByTab.help}
        />
      </View>

      <ScrollView
        style={styles.listContent}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}>

        <Animated.View key={activeTab} entering={FadeInDown.duration(220)}>
          {renderTabContent()}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

function HomeTabButton({
  label,
  active,
  onPress,
  tintColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tintColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        active ? { borderColor: tintColor, backgroundColor: tintColor + '20' } : { borderColor: 'transparent' },
        { opacity: pressed ? 0.75 : 1 },
      ]}>
      <ThemedText style={[styles.tabButtonText, active ? { color: tintColor, fontWeight: '700' } : { opacity: 0.65 }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixedTabsWrap: { marginHorizontal: 12, borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row', marginBottom: 10 },
  listContent: { flex: 1 },
  listContentContainer: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 },
  overviewWrap: { gap: 12 },
  bannerWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  bannerImage: { width: '100%', height: 200 },
  exploreDropdownWrap: { gap: 6 },
  exploreDropdownTrigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreDropdownText: { fontSize: 13, fontWeight: '700' },
  exploreDropdownMenu: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  exploreDropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  exploreDropdownItemText: { fontSize: 13 },
  exploreDropdownDivider: { height: 1 },
  explorePointsWrap: { gap: 4, marginTop: 2 },
  explorePoint: { fontSize: 12, lineHeight: 17, opacity: 0.82 },
  latestUpdatesHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  latestUpdatesHeaderIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  latestUpdatesSubtext: { fontSize: 11, opacity: 0.72 },
  latestUpdatesListWrap: { gap: 8 },
  latestUpdateCard: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  latestUpdateTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  latestUpdateBullet: { width: 6, height: 6, borderRadius: 3 },
  latestUpdateTag: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  latestUpdateText: { fontSize: 12, lineHeight: 18, opacity: 0.88 },
  tabButton: { flex: 1, borderWidth: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  tabButtonText: { fontSize: 12 },
  contentCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  overviewServicesCard: { borderRadius: 16, padding: 12, gap: 10 },
  overviewServicesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  overviewServicesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  overviewServiceItem: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
    gap: 5,
  },
  overviewServiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewServiceImage: { width: 20, height: 20 },
  overviewServiceTitle: { fontSize: 11, lineHeight: 14, textAlign: 'center', minHeight: 28 },
  overviewServiceCategory: { fontSize: 9.5, opacity: 0.65 },
  overviewServiceTagPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  overviewServiceTagText: { fontSize: 9, fontWeight: '700' },
  bookingCarouselDivider: { height: 1, borderRadius: 1, marginVertical: 2 },
  overviewQuickLinksWrap: { gap: 16, paddingHorizontal: 2 },
  overviewQuickLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  overviewQuickLinkText: { flex: 1, fontSize: 14, fontWeight: '600' },
  sectionCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(128,128,128,0.15)' },
  sectionBannerWrap: { position: 'relative' },
  sectionBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, paddingHorizontal: 16 },
  sectionBannerIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sectionBannerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionBannerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 1 },
  sectionBtnsWrap: { padding: 12, gap: 10 },
  sectionInnerImage: { width: '100%', height: 160 },
  updateSlideCard: {},
  updateSlideHeader: {},
  updateSlideBadge: {},
  updateSlideBadgeText: {},
  updateSlideText: {},
  premiumNewsCard: { borderRadius: 16, padding: 12, gap: 10 },
  cardText: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  latestNewsWrap: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 6, gap: 8 },
  newsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  newsHeaderTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  newsHeaderIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  latestNewsTitle: { fontSize: 14 },
  latestNewsSubtitle: { fontSize: 11, opacity: 0.68, marginTop: 1 },
  viewMoreBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  viewMoreText: { fontSize: 12, fontWeight: '700' },
  newsListWrap: { gap: 8 },
  newsCarouselContent: { gap: 8 },
  newsItem: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 8, gap: 8 },
  newsPaginationWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  newsPaginationDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  newsImage: { width: '100%', height: 172, borderRadius: 10 },
  newsTextWrap: { gap: 8 },
  newsDate: { fontSize: 11, opacity: 0.65 },
  newsTitle: { fontSize: 12.5, lineHeight: 18 },
  viewDetailsBtn: { alignSelf: 'flex-end', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  viewDetailsText: { fontSize: 11, fontWeight: '700' },
  supportLinksWrap: { gap: 8, marginTop: 4 },
  supportLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12 },
  supportLinkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  supportLinkLabel: { fontSize: 13, fontWeight: '600' },
  supportLinkSub: { fontSize: 11, opacity: 0.62, marginTop: 1 },
});

// ── Dress Code flat styles ────────────────────────────────────────────────────
const dressSectionWrap: import('react-native').ViewStyle = { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginTop: 4 };
const dressSectionHeader: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 };
const dressSectionTitle: import('react-native').TextStyle = { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 };
const dressItemRow: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 6 };
const dressBullet: import('react-native').ViewStyle = { width: 5, height: 5, borderRadius: 3, marginTop: 5 };
const dressItemText: import('react-native').TextStyle = { fontSize: 12, lineHeight: 18, flex: 1, opacity: 0.85 };

// ── Do's & Don'ts flat styles ─────────────────────────────────────────────────
const dosDontsGrid: import('react-native').ViewStyle = { flexDirection: 'row', gap: 8, marginTop: 4 };
const dosDontsColumn: import('react-native').ViewStyle = { flex: 1, gap: 6 };
const dosDontsColHeader: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 };
const dosDontsColTitle: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700' };
const dosDontsItemRow: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 };
const dosDontsItemText: import('react-native').TextStyle = { fontSize: 11.5, lineHeight: 17, flex: 1, opacity: 0.84 };
