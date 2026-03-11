import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resolveTtdIcon } from '@/constants/ttd-service-icons';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLiveUpdates } from '@/hooks/use-live-updates';
import { useServicesCatalog } from '@/hooks/use-services-catalog';
import { useHelpContent } from '@/hooks/use-help-content';
import { useUpcomingBookings, type UpcomingBookingService } from '@/hooks/use-upcoming-bookings';
import { type Service } from '@/types/services';

type HomeTab = 'overview' | 'explore' | 'help';

type LatestNewsItem = {
  date?: string;
  link?: string;
  text: string;
};

type OverviewServiceItem = Service & {
  categoryHeading: string;
};

/** Gradient button with a left-to-right shimmer sweep animation. */
function ShimmerButton({
  label,
  onPress,
  accentColor,
  alignEnd = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  accentColor: string;
  alignEnd?: boolean;
  icon?: string;
}) {
  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [shimBtnWrap, alignEnd && { alignSelf: 'flex-end' }, { opacity: pressed ? 0.82 : 1 }]}>
      <LinearGradient
        colors={[accentColor + 'CC', accentColor, accentColor + 'EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={shimBtnGradient}>
        {/* shimmer sweep overlay */}
        <RNAnimated.View
          style={[
            shimBtnShimmer,
            {
              transform: [{
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 160],
                }),
              }],
            },
          ]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.30)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 48, height: '100%' }}
          />
        </RNAnimated.View>
        {icon ? (
          <MaterialCommunityIcons name={icon as any} size={11} color="#fff" style={{ marginRight: 5 }} />
        ) : null}
        <ThemedText style={shimBtnText}>{label}</ThemedText>
        <MaterialCommunityIcons name="chevron-right" size={12} color="rgba(255,255,255,0.85)" style={{ marginLeft: 2 }} />
      </LinearGradient>
    </Pressable>
  );
}

const shimBtnWrap: import('react-native').ViewStyle = { borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' };
const shimBtnGradient: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' };
const shimBtnShimmer: import('react-native').ViewStyle = { position: 'absolute', top: 0, bottom: 0, width: 48 };
const shimBtnText: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700', color: '#fff' };

function SsdLiveButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const ringAnim = useRef(new RNAnimated.Value(0)).current;
  const chevronAnim = useRef(new RNAnimated.Value(0)).current;

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
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(chevronAnim, { toValue: 6, duration: 420, useNativeDriver: true }),
        RNAnimated.timing(chevronAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
        RNAnimated.delay(800),
      ])
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
          <RNAnimated.View style={{ transform: [{ translateX: chevronAnim }] }}>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
          </RNAnimated.View>
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

function ExploreNewsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [exploreNewsBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#10d9a0', '#059669', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Browse News</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>Tap to explore the Darshan News tab</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const exploreNewsBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#059669',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

function HelpGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [helpGuideBtnPressable, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient
        colors={['#fbbf24', '#d97706', '#92400e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ssdBtnGradient}>
        <View style={ssdBtnLeft}>
          <View style={ssdBtnIconWrap}>
            <MaterialCommunityIcons name="help-circle-outline" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText style={ssdBtnTitle}>Help & Guide</ThemedText>
            <ThemedText style={ssdBtnSubtitle}>FAQs, dress code & contact support</ThemedText>
          </View>
        </View>
        <View style={ssdBtnRight}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const helpGuideBtnPressable: import('react-native').ViewStyle = {
  borderRadius: 18,
  shadowColor: '#d97706',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

function CollapsibleHelpCard({
  title,
  subtitle,
  icon,
  accentColor,
  defaultExpanded = false,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);

  const toggle = () => {
    const next = !expanded;
    rotation.value = withTiming(next ? 180 : 0, { duration: 250 });
    setExpanded(next);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <ThemedView style={[collapsibleCardWrap, { borderColor: accentColor, backgroundColor: accentColor + '10' }]}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [collapsibleCardHeader, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={[collapsibleIconWrap, { backgroundColor: accentColor + '20' }]}>
            <MaterialCommunityIcons name={icon} size={16} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[collapsibleTitle, { color: accentColor }]}>{title}</ThemedText>
            <ThemedText style={collapsibleSubtitle}>{subtitle}</ThemedText>
          </View>
        </View>
        <Animated.View style={[collapsibleChevronWrap, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }, chevronStyle]}>
          <MaterialCommunityIcons name="chevron-down" size={18} color={accentColor} />
        </Animated.View>
      </Pressable>
      {expanded ? <View style={collapsibleBody}>{children}</View> : null}
    </ThemedView>
  );
}

const collapsibleCardWrap: import('react-native').ViewStyle = { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 0 };
const collapsibleCardHeader: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 };
const collapsibleIconWrap: import('react-native').ViewStyle = { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' };
const collapsibleTitle: import('react-native').TextStyle = { fontSize: 14, fontWeight: '700', lineHeight: 18 };
const collapsibleSubtitle: import('react-native').TextStyle = { fontSize: 11, opacity: 0.55, marginTop: 1 };
const collapsibleChevronWrap: import('react-native').ViewStyle = { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' };
const collapsibleBody: import('react-native').ViewStyle = { paddingHorizontal: 14, paddingBottom: 14, gap: 10 };

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
  const arrowAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(arrowAnim, { toValue: 6, duration: 420, useNativeDriver: true }),
        RNAnimated.timing(arrowAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
        RNAnimated.delay(800),
      ])
    ).start();
  }, []);

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
        <RNAnimated.View style={{ transform: [{ translateX: arrowAnim }] }}>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
        </RNAnimated.View>
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
  const { latestUpdates, loading: liveLoading } = useLiveUpdates();
  const { overviewServices, loading: servicesLoading, error: servicesError } = useServicesCatalog();
  const { content: helpContent, loading: helpLoading } = useHelpContent();
  const overviewServiceItems: OverviewServiceItem[] = overviewServices;
  const { services: upcomingBookings } = useUpcomingBookings();
  const bookingCardWidth = upcomingBookings.length === 1 ? screenWidth - 48 : screenWidth - 48 - 20;

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    help: tintColor,
  };
  const activeAccent = accentByTab[activeTab];
  const newsItems: LatestNewsItem[] = latestUpdates;
  const previewNewsItems = newsItems;
  const newsSlideWidth = previewNewsItems.length > 1
    ? Math.max(240, screenWidth - 52 - 28)
    : Math.max(260, screenWidth - 52);
  useEffect(() => {
    if (activeNewsSlide >= previewNewsItems.length) {
      setActiveNewsSlide(0);
    }
  }, [activeNewsSlide, previewNewsItems.length]);

  const handleNewsScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / (newsSlideWidth + 8));
    const clampedIndex = Math.max(0, Math.min(rawIndex, previewNewsItems.length - 1));
    setActiveNewsSlide(clampedIndex);
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
                <View style={qsHeaderWrap}>
                  <LinearGradient
                    colors={['#7c3aed28', '#7c3aed08']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={qsHeaderGradient}>
                    <View style={[qsHeaderIconCircle, { backgroundColor: '#7c3aed35' }]}>
                      <MaterialCommunityIcons name="clock-fast" size={18} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[qsHeaderTitle, { color: '#7c3aed' }]}>Opening Soon</ThemedText>
                      <ThemedText style={qsHeaderSubtitle}>Upcoming booking schedules</ThemedText>
                    </View>
                    <ShimmerButton label="View All" onPress={() => router.push('/upcoming-bookings' as any)} accentColor="#7c3aed" />
                  </LinearGradient>
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

            {/* ── Quick Services Header ── */}
            <View style={qsHeaderWrap}>
              <LinearGradient
                colors={[activeAccent + '28', activeAccent + '08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={qsHeaderGradient}>
                <View style={[qsHeaderIconCircle, { backgroundColor: activeAccent + '35' }]}>
                  <MaterialCommunityIcons name="apps" size={18} color={activeAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[qsHeaderTitle, { color: activeAccent }]}>Quick Services</ThemedText>
                  <ThemedText style={qsHeaderSubtitle}>Tap any service to get started</ThemedText>
                </View>
                    <ShimmerButton label="All" onPress={() => router.push('/(tabs)/services')} accentColor={activeAccent} />
              </LinearGradient>
            </View>

            {servicesLoading ? <ThemedText style={styles.newsDate}>Loading services…</ThemedText> : null}
            {!servicesLoading && servicesError ? <ThemedText style={styles.newsDate}>Unable to load services.</ThemedText> : null}
            {!servicesLoading && !servicesError && overviewServiceItems.length === 0 ? (
              <ThemedText style={styles.newsDate}>No services available.</ThemedText>
            ) : null}

            {!servicesLoading && !servicesError && overviewServiceItems.length > 0 ? (
              <View style={qsGrid}>
                {overviewServiceItems.map((service) => {
                  const cardWidth = (screenWidth - 24 - 28 - 10) / 2;
                  return (
                    <Pressable
                      key={service.id}
                      style={({ pressed }) => [qsCard, { opacity: pressed ? 0.82 : 1, width: cardWidth, borderColor: activeAccent + '55' }]}
                      onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
                      <LinearGradient
                        colors={[activeAccent + '42', activeAccent + '18']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={qsCardGradient}>
                        {/* Decorative blobs */}
                        <View style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: 36, backgroundColor: activeAccent, opacity: 0.1 }} />
                        <View style={{ position: 'absolute', bottom: -12, left: -14, width: 52, height: 52, borderRadius: 26, backgroundColor: activeAccent, opacity: 0.07 }} />

                        {/* Top-right link icon */}
                        <MaterialCommunityIcons
                          name="open-in-new"
                          size={14}
                          color={activeAccent + 'AA'}
                          style={{ position: 'absolute', top: 10, right: 10 }}
                        />

                        {/* Icon */}
                        <View style={qsIconWrap}>
                          {service.iconImage ? (
                            <Image source={{ uri: service.iconImage }} style={qsIconImage} contentFit="contain" />
                          ) : (
                            <MaterialCommunityIcons
                              name={resolveTtdIcon(service.title, service.icon)}
                              size={28}
                              color={activeAccent}
                            />
                          )}
                        </View>

                        {/* Title */}
                        <ThemedText style={qsCardTitle} numberOfLines={2}>{service.title}</ThemedText>

                        {/* Category + tag row */}
                        <View style={qsCategoryRow}>
                          <View style={[qsCategoryDot, { backgroundColor: activeAccent + '80' }]} />
                          <ThemedText style={[qsCardCategory, { color: activeAccent + 'CC' }]} numberOfLines={1}>{service.categoryHeading}</ThemedText>
                          {service.tag ? (
                            <View style={[qsTagBadge, { backgroundColor: (service.tagColor ?? activeAccent) + '28', borderWidth: 1, borderColor: (service.tagColor ?? activeAccent) + '66' }]}>
                              <ThemedText style={[qsTagBadgeText, { color: service.tagColor ?? activeAccent }]}>{service.tag}</ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </ThemedView>

          <View style={styles.overviewQuickLinksWrap}>

            {/* ── Free Tickets ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  // source={require('../../assets/images/free-tickets.png')}
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
                source={require('../../assets/images/free-tickets.png')}
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
                  // source={require('../../assets/images/explore-hero-image.png')}
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
                source={require('../../assets/images/pilgrim-updates.png')}
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
                  // source={require('../../assets/images/support-hero-image.png')}
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
                source={require('../../assets/images/todays-sevas.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <DayScheduleButton onPress={() => router.push({ pathname: '/(tabs)/news', params: { tab: 'schedule' } })} />
              </View>
            </View>

            {/* ── Latest News ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  // source={require('../../assets/images/explore-hero-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(16,217,160,0.82)', 'rgba(5,150,105,0.90)', 'rgba(6,78,59,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Latest News</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>Darshan news, SSD & live updates</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              <Image
                source={require('../../assets/images/news.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <ExploreNewsButton onPress={() => setActiveTab('explore')} />
              </View>
            </View>

            {/* ── Help & Guide ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionBannerWrap}>
                <Image
                  // source={require('../../assets/images/support-hero-image.png')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                />
                <LinearGradient
                  colors={['rgba(251,191,36,0.82)', 'rgba(217,119,6,0.90)', 'rgba(146,64,14,0.96)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionBanner}>
                  <View style={styles.sectionBannerIconWrap}>
                    <MaterialCommunityIcons name="help-circle-outline" size={20} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.sectionBannerTitle}>Help & Guide</ThemedText>
                    <ThemedText style={styles.sectionBannerSubtitle}>FAQs, dress code & contact support</ThemedText>
                  </View>
                </LinearGradient>
              </View>
              <Image
                source={require('../../assets/images/help-guide.png')}
                style={styles.sectionInnerImage}
                contentFit="cover"
                contentPosition="center"
              />
              <View style={styles.sectionBtnsWrap}>
                <HelpGuideButton onPress={() => setActiveTab('help')} />
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
            {/* ── Latest News header ── */}
            <View style={qsHeaderWrap}>
              <LinearGradient
                colors={[activeAccent + '28', activeAccent + '08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={qsHeaderGradient}>
                <View style={[qsHeaderIconCircle, { backgroundColor: activeAccent + '35' }]}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={activeAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[qsHeaderTitle, { color: activeAccent }]}>Latest News</ThemedText>
                  <ThemedText style={qsHeaderSubtitle}>Official TTD news &amp; updates</ThemedText>
                </View>
                {!liveLoading && newsItems.length > 0 ? (
                  <ShimmerButton label="View More" onPress={() => router.push('/latest-news')} accentColor={activeAccent} />
                ) : null}
              </LinearGradient>
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
                      key={`${item.date ?? ''}-${item.text.slice(0, 20)}`}
                      style={[
                        styles.newsItem,
                        {
                          width: newsSlideWidth,
                          borderColor: activeAccent + '30',
                          backgroundColor: activeAccent + '08',
                          flexDirection: 'row',
                          padding: 0,
                          overflow: 'hidden',
                        },
                      ]}>
                      {/* Left accent bar */}
                      <View style={{ width: 4, backgroundColor: activeAccent, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />

                      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between', gap: 10 }}>
                        {/* Top row: date badge + icon */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: activeAccent + '18', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <MaterialCommunityIcons name="calendar-outline" size={10} color={activeAccent} />
                            <ThemedText style={{ fontSize: 10, fontWeight: '600', color: activeAccent }}>
                              {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </ThemedText>
                          </View>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: activeAccent + '15', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="newspaper-variant-outline" size={13} color={activeAccent} />
                          </View>
                        </View>

                        {/* Title */}
                        <ThemedText style={[styles.newsTitle, { fontWeight: '600', lineHeight: 19 }]} numberOfLines={8}>{item.text}</ThemedText>

                        {/* Footer */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: activeAccent }} />
                            <ThemedText style={{ fontSize: 10, opacity: 0.55 }}>TTD Official</ThemedText>
                          </View>
                          <ShimmerButton label="Read" onPress={() => item.link ? void Linking.openURL(item.link) : undefined} accentColor={activeAccent} />
                        </View>
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
                          key={`${item.date ?? ''}-${item.text.slice(0, 20)}-dot`}
                          style={[
                            styles.newsPaginationDot,
                            isActive
                              ? { backgroundColor: activeAccent, borderColor: activeAccent }
                              : { backgroundColor: 'transparent', borderColor: activeAccent + '55' },
                          ]}
                        />
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}
          </ThemedView>
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
          <CollapsibleHelpCard title="Dress Code" subtitle="What to wear at Tirumala" icon="tshirt-crew-outline" accentColor={activeAccent}>
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
          </CollapsibleHelpCard>
        ) : null}

        {/* ── Do's & Don'ts ── */}
        {!helpLoading ? (
          <CollapsibleHelpCard title="Do's & Don'ts" subtitle="Tips for a smooth pilgrimage" icon="clipboard-check-outline" accentColor={activeAccent}>
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
          </CollapsibleHelpCard>
        ) : null}

        {/* ── FAQs ── */}
        {!helpLoading ? (
          <CollapsibleHelpCard title="FAQs" subtitle="Common questions answered" icon="frequently-asked-questions" accentColor={activeAccent}>
            <FaqList items={helpContent.faqs} accentColor={activeAccent} />
          </CollapsibleHelpCard>
        ) : null}

        {/* ── Contact & Support ── */}
        {!helpLoading ? (
          <CollapsibleHelpCard title="Contact & Support" subtitle="Reach TTD directly" icon="headset" accentColor={activeAccent}>
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
          </CollapsibleHelpCard>
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
  newsItem: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 160 },
  newsPaginationWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  newsPaginationDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  newsTextWrap: { flex: 1, justifyContent: 'space-between', gap: 8 },
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

// ── Quick Services card styles ────────────────────────────────────────────────
const qsHeaderWrap: import('react-native').ViewStyle = {};
const qsHeaderGradient: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12 };
const qsHeaderIconCircle: import('react-native').ViewStyle = { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' };
const qsHeaderTitle: import('react-native').TextStyle = { fontSize: 14.5, fontWeight: '800', letterSpacing: 0.1 };
const qsHeaderSubtitle: import('react-native').TextStyle = { fontSize: 10.5, opacity: 0.58, marginTop: 2 };
const qsViewAllBtn: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 2 };
const qsViewAllText: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700' };
const qsGrid: import('react-native').ViewStyle = { flexDirection: 'row', flexWrap: 'wrap', gap: 10 };
const qsCard: import('react-native').ViewStyle = { borderRadius: 18, borderWidth: 1, overflow: 'hidden' };
const qsCardGradient: import('react-native').ViewStyle = { height: 158, padding: 12, overflow: 'hidden', justifyContent: 'flex-end' };
const qsTagBadge: import('react-native').ViewStyle = { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 };
const qsTagBadgeText: import('react-native').TextStyle = { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.3 };
const qsIconWrap: import('react-native').ViewStyle = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 };
const qsIconImage: import('react-native').ImageStyle = { width: 26, height: 26 };
const qsCardTitle: import('react-native').TextStyle = { fontSize: 12.5, fontWeight: '800', lineHeight: 16.5 };
const qsCategoryRow: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 };
const qsCategoryDot: import('react-native').ViewStyle = { width: 5, height: 5, borderRadius: 3 };
const qsCardCategory: import('react-native').TextStyle = { fontSize: 10, fontWeight: '500', flex: 1 };

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
