import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, FlatList, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useLiveUpdates } from '@/hooks/use-live-updates';
import { useColorScheme } from '@/hooks/use-color-scheme';

type DarshanNewsItem = {
  date: string;
  pilgrims: string;
  tonsures: string;
  hundi: string;
  waiting: string;
  time: string;
};

type NewsSubTab = 'ssd' | 'schedule' | 'pilgrims';

type InfoItem = {
  id: string;
  title: string;
  detail: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

type DayScheduleItem = {
  event: string;
  time: string;
};

type DayScheduleData = {
  date: string;
  day: string;
  schedules: DayScheduleItem[];
};

const DARSHAN_NEWS: DarshanNewsItem[] = [
  { date: '2026-02-25', pilgrims: '73,035', tonsures: '27,090', hundi: '4.48CR', waiting: '25.No. Pilgrims utilized Med. Services: 2,547', time: '12-15H' },
  { date: '2026-02-24', pilgrims: '74,902', tonsures: '22,869', hundi: '4.05CR', waiting: '25 Compartments', time: '12H' },
  { date: '2026-02-23', pilgrims: '77,803', tonsures: '27,766', hundi: '4.66CR', waiting: '31 Compartments', time: '18H' },
  { date: '2026-02-22', pilgrims: '76,506', tonsures: '28,049', hundi: '4.20CR', waiting: '25 Compartments', time: '15H' },
  { date: '2026-02-21', pilgrims: '82,043', tonsures: '32,299', hundi: '3.74CR', waiting: 'Outside line at Krishna Teja Guest house', time: '16H' },
  { date: '2026-02-20', pilgrims: '68,156', tonsures: '28,295', hundi: '3.46 CR', waiting: 'Outside line at Sila thoranam', time: '18-20H' },
  { date: '2026-02-19', pilgrims: '57,682', tonsures: '27,020', hundi: '3.65 CR', waiting: 'Outside line at Krishna Teja Guest house', time: '10-12H' },
  { date: '2026-02-18', pilgrims: '63,804', tonsures: '24,142', hundi: '3.90 CR', waiting: '14 Compartments', time: '10-12H' },
  { date: '2026-02-17', pilgrims: '70,509', tonsures: '18,058', hundi: '4.20 CR', waiting: '04 Compartments', time: '06 H' },
  { date: '2026-02-16', pilgrims: '73,776', tonsures: '23,291', hundi: '4.42 CR', waiting: '13 Compartments', time: '08 H' },
];

const SSD_STATUS = {
  runningSlot: '14',
  date: '2026-02-26',
  slotDate: '27-Feb-2026',
  balanceDate: '27-Feb-2026',
  balanceTickets: '0',
};

const SSD_TOKEN_INFO: InfoItem[] = [
  {
    id: '1',
    title: 'Queue Status',
    detail: 'Pilgrims are currently waiting in the Q-line to take SSD tokens at counters.',
    icon: 'account-clock-outline',
  },
  {
    id: '2',
    title: 'Issue Policy',
    detail: 'Tickets are issued on first-come-first-service basis at physical counters.',
    icon: 'clipboard-text-clock-outline',
  },
  {
    id: '3',
    title: 'Important Note',
    detail:
      'Live ticket status may vary by the time pilgrims reach counters. Tokens are issued on first-come-first-service basis for pilgrims waiting in Q-line.',
    icon: 'card-account-details-outline',
  },
];

function getIstDateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Cycling gradient palettes for recent cards (all distinct from the hero purple)
const CARD_PALETTES: [string, string, string][] = [
  ['#0a3d3a', '#0e6b5e', '#2abfaa'],   // teal
  ['#1a1f60', '#2e3ea8', '#6b80ef'],   // indigo-blue
  ['#3a1a00', '#8b4200', '#e08030'],   // deep amber
  ['#0d300f', '#1a6b2e', '#43c870'],   // forest green
  ['#4a0d18', '#8b1a2e', '#e0566a'],   // crimson
  ['#1a0a40', '#3d1a88', '#8b60d0'],   // deep violet (differs from hero)
  ['#003044', '#006080', '#20b0d0'],   // ocean blue
  ['#2a1a00', '#6b4000', '#c07820'],   // bronze
];

function normalizeDateKey(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('.');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return input;
}

// Expand abbreviated units to full words
function expandHundi(val: string): string {
  return val.replace(/\s*crores?\s*/gi, ' Crores').replace(/\s*CR\s*/gi, ' Crores').trim();
}

function expandDarshanTime(val: string): string {
  // "12-15H" → "12-15 Hours"  |  "06 H" → "06 Hours"
  return val
    .replace(/(\d)\s*-\s*(\d+)\s*H\b/gi, '$1–$2 Hours')
    .replace(/(\d+)\s*H\b/gi, '$1 Hours')
    .trim();
}

const DAY_SCHEDULE_DATA: DayScheduleData = {
  date: '2026-03-01',
  day: 'Sunday',
  schedules: [
    { event: 'Suprabhatam', time: '02:30-03:00 hrs' },
    { event: 'Thomala Seva (Ekantam)', time: '03:30 - 04:00 hrs' },
    { event: 'Koluvu and Panchanga Sravanam (Ekantam)', time: '04:00 - 04:15 hrs' },
    { event: 'First Archana, Sahasranama Archana (Ekantam)', time: '04:00 - 04:30 hrs' },
    { event: 'FirstBell, Bali and Sattumura', time: '06:30- 07:00 hrs' },
    { event: 'Suddhi Second Archana (Ekantam), SecondBell,etc.', time: '07:00 - 07:30 hrs' },
    { event: 'Darshanam', time: '07:30 - 19:00 hrs' },
    { event: 'Kalyanostavam, Brahmostavam, Vasanthostavam, Unjal Seva', time: '12:00 - 17:00 hrs' },
    { event: 'Sahasra Deepalankarana Seva', time: '17:30 - 18:30 hrs' },
    { event: 'Suddhi, Night Kainkaryams (Ekantam) and Night Bell', time: '19:00 - 20:00 hrs' },
    { event: 'Darshanam', time: '20:00 - 00:30 hrs' },
    { event: 'Suddi and preparations for Ekanta Seva', time: '00:30 - 00:45 hrs' },
    { event: 'Ekanta Seva', time: '00:45 hrs' },
  ],
};

function to12h(h: number, m: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min} ${period}`;
}

function formatScheduleTime12h(timeStr: string): string {
  const rangeMatch = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (rangeMatch) {
    const sh = parseInt(rangeMatch[1]);
    const sm = parseInt(rangeMatch[2]);
    const eh = parseInt(rangeMatch[3]);
    const em = parseInt(rangeMatch[4]);
    return `${to12h(sh, sm)} – ${to12h(eh, em)}`;
  }
  const pointMatch = timeStr.match(/(\d{2}):(\d{2})/);
  if (pointMatch) {
    return to12h(parseInt(pointMatch[1]), parseInt(pointMatch[2]));
  }
  return timeStr;
}

function parseScheduleMinutes(timeStr: string): { startMin: number; endMin: number | null } {
  const rangeMatch = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (rangeMatch) {
    const sh = parseInt(rangeMatch[1]);
    const sm = parseInt(rangeMatch[2]);
    const eh = parseInt(rangeMatch[3]);
    const em = parseInt(rangeMatch[4]);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    // hours 0-1 belong to next calendar day in this schedule (day starts at ~02:30)
    if (sh < 2) startMin += 24 * 60;
    if (sh >= 2 && eh < 2) endMin += 24 * 60; // crosses midnight
    if (sh < 2 && eh < 2) { startMin += 0; endMin += 24 * 60; } // both next-day, already offset above for startMin
    return { startMin, endMin };
  }
  const pointMatch = timeStr.match(/(\d{2}):(\d{2})/);
  if (pointMatch) {
    const sh = parseInt(pointMatch[1]);
    const sm = parseInt(pointMatch[2]);
    let startMin = sh * 60 + sm;
    if (sh < 2) startMin += 24 * 60;
    return { startMin, endMin: null };
  }
  return { startMin: -1, endMin: null };
}

function getScheduleStatus(timeStr: string): 'past' | 'current' | 'upcoming' {
  // IST = UTC + 5:30 — avoid toLocaleString timezone which is unreliable in Hermes
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(Date.now() + istOffsetMs);
  const istHour = istDate.getUTCHours();
  const istMinute = istDate.getUTCMinutes();
  // Anything between 00:00–01:59 is the "next-day" tail in this schedule
  let currentMin = istHour * 60 + istMinute;
  if (istHour < 2) currentMin += 24 * 60;

  const { startMin, endMin } = parseScheduleMinutes(timeStr);
  if (startMin === -1) return 'upcoming';

  if (endMin !== null) {
    if (endMin <= currentMin) return 'past';
    if (startMin <= currentMin) return 'current';
    return 'upcoming';
  } else {
    if (startMin + 30 <= currentMin) return 'past';
    if (startMin <= currentMin) return 'current';
    return 'upcoming';
  }
}

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = Colors[colorScheme].icon;
  const tintColor = MainTabAccent.news;
  const insets = useSafeAreaInsets();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<NewsSubTab>('pilgrims');

  useFocusEffect(
    useCallback(() => {
      if (tabParam === 'ssd' || tabParam === 'schedule' || tabParam === 'pilgrims') {
        setActiveTab(tabParam);
      }
    }, [tabParam])
  );

  // ── Live Firebase data (merges over static fallbacks) ────────────────────
  const { ssdToken, pilgrimsToday, pilgrimsRecent, daySchedule, loading: liveLoading } = useLiveUpdates();

  const recentNews = pilgrimsRecent.length > 0 ? pilgrimsRecent : DARSHAN_NEWS;
  const sortedRecentNews = [...recentNews].sort((a, b) =>
    normalizeDateKey(b.date).localeCompare(normalizeDateKey(a.date))
  );
  const staticLatest = sortedRecentNews[0] ?? DARSHAN_NEWS[0];
  const olderNews = sortedRecentNews.slice(1);
  const latestNews = pilgrimsToday ?? staticLatest;
  const istTodayKey = getIstDateKey();
  const latestDateKey = normalizeDateKey(latestNews.date);
  const latestBadgeText = latestDateKey === istTodayKey ? 'TODAY' : 'RECENT';
  const liveSsd = ssdToken ?? SSD_STATUS;
  const effectiveDaySchedule = (daySchedule ?? DAY_SCHEDULE_DATA) as DayScheduleData;
  const ssdDisplayDate = liveSsd.balanceDate ?? liveSsd.slotDate ?? liveSsd.date;
  const isSoldOut = liveSsd.balanceTickets === '0';
  const isLive = !liveLoading && (ssdToken !== null || pilgrimsToday !== null);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={colorScheme === 'dark' ? [tintColor + 'CC', tintColor + '66', 'transparent'] : [tintColor + 'DD', tintColor + '88', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        {/* Decorative blobs */}
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#fff', opacity: 0.05, top: -28, right: -24 }} />
        <View style={{ position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', opacity: 0.04, bottom: -10, left: -12 }} />

        <View style={styles.titleRow}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }}>
            <MaterialCommunityIcons name="temple-hindu" size={22} color={colorScheme === 'dark' ? '#fff' : '#1a1a1a'} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.3, color: colorScheme === 'dark' ? '#fff' : '#1a1a1a' }}>Darshan</ThemedText>
            <ThemedText style={{ fontSize: 11, color: colorScheme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.50)', marginTop: 1 }}>Live pilgrim & temple updates</ThemedText>
          </View>
          {liveLoading ? (
            <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#fff' : tintColor} />
          ) : isLive ? (
            <View style={[styles.liveBadge, { backgroundColor: '#4CAF5022', borderColor: '#4CAF5060' }]}>
              <View style={[styles.liveDot, { backgroundColor: '#4CAF50' }]} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[styles.subTabsWrap, { borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.25)' : '#000000' }]}>
          <SubTabButton label="Pilgrim Updates" active={activeTab === 'pilgrims'} onPress={() => setActiveTab('pilgrims')} tintColor={tintColor} colorScheme={colorScheme} />
          <SubTabButton label="Day Schedules" active={activeTab === 'schedule'} onPress={() => setActiveTab('schedule')} tintColor={tintColor} colorScheme={colorScheme} />
          <SubTabButton label="SSD Token" active={activeTab === 'ssd'} onPress={() => setActiveTab('ssd')} tintColor={tintColor} colorScheme={colorScheme} />
        </View>
      </LinearGradient>

      {activeTab === 'pilgrims' ? (
        <FlatList
          key="pilgrims-list"
          data={olderNews}
          keyExtractor={(item) => item.date}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Animated.View entering={FadeInDown.duration(280)} style={styles.bannerWrap}>
                <Image
                  source={require('../../assets/images/banner-image.png')}
                  style={styles.bannerImage}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(450)} style={styles.featuredWrap}>
              <LinearGradient
                colors={['#2d1b7a', '#5240c4', '#9D8FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Header: date + badge */}
                <View style={styles.heroHeaderRow}>
                  <View style={styles.heroDatePill}>
                    <MaterialCommunityIcons name="star-circle" size={13} color="#fff" />
                    <ThemedText style={styles.heroDateText}>{latestNews.date}</ThemedText>
                  </View>
                  <View style={[styles.heroBadge, { backgroundColor: '#4CAF50' }]}>
                    <ThemedText style={styles.heroBadgeText}>{latestBadgeText}</ThemedText>
                  </View>
                </View>

                {/* Hero pilgrim count */}
                <View style={styles.heroCountSection}>
                  <View style={styles.heroCountIcon}>
                    <MaterialCommunityIcons name="account-group" size={44} color="rgba(255,255,255,0.92)" />
                  </View>
                  <View style={{ gap: 3 }}>
                    <ThemedText style={styles.heroCount}>{latestNews.pilgrims}</ThemedText>
                    <ThemedText style={styles.heroCountLabel}>Pilgrims had Darshan</ThemedText>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.heroDivider} />

                {/* Stats row */}
                <View style={styles.heroStatsRow}>
                  <HeroStat icon="content-cut" label="Tonsures" value={latestNews.tonsures} />
                  <View style={styles.heroStatSeparator} />
                  <HeroStat icon="cash-multiple" label="Hundi Collected" value={expandHundi(latestNews.hundi)} />
                  <View style={styles.heroStatSeparator} />
                  <HeroStat icon="timer-sand" label="Darshan Time" value={expandDarshanTime(latestNews.time)} />
                </View>

                {/* Waiting */}
                <View style={styles.heroWaitingBox}>
                  <View style={styles.heroWaitingTitleRow}>
                    <MaterialCommunityIcons name="map-marker-path" size={14} color="rgba(255,255,255,0.65)" />
                    <ThemedText style={styles.heroWaitingTitle}>Queue / Waiting Position</ThemedText>
                  </View>
                  <ThemedText style={styles.heroWaitingValue}>{latestNews.waiting}</ThemedText>
                </View>
              </LinearGradient>
            </Animated.View>
            {/* Recent section header */}
            <View style={styles.recentSectionHeader}>
              <View style={[styles.recentSectionAccent, { backgroundColor: tintColor }]} />
              <ThemedText style={[styles.recentSectionTitle, { color: tintColor }]}>Recent Updates</ThemedText>
              {/* <ThemedText style={styles.recentSectionSub}>Historical pilgrim data</ThemedText> */}
            </View>
            </>
          }
          renderItem={({ item, index }) => {
            const accent = '#6b80ef';
            return (
            <Animated.View entering={FadeInDown.delay((index + 1) * 60).duration(360)} style={styles.cardWrap}>
              <ThemedView style={[styles.pilgrimCard, { borderColor: accent + '80', backgroundColor: accent + '14' }]}>

                {/* Title row: date + pilgrim count */}
                <View style={styles.ssdTitleRow}>
                  <View style={[styles.ssdTitleIconWrap, { backgroundColor: accent + '28' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color={accent} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: '900', color: accent, lineHeight: 22 }}>{item.pilgrims}</ThemedText>
                    <ThemedText style={{ fontSize: 10, opacity: 0.6, lineHeight: 14 }}>Pilgrims had Darshan</ThemedText>
                  </View>
                  <View style={[styles.ssdStatusBadge, { backgroundColor: accent + '20', borderColor: accent + '55' }]}>
                    <MaterialCommunityIcons name="calendar-today" size={11} color={accent} />
                    <ThemedText style={[styles.ssdStatusBadgeText, { color: accent }]}>{item.date}</ThemedText>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: accent + '30', marginVertical: 2 }} />

                {/* 3 metric boxes */}
                <View style={styles.ssdMetricsRow}>
                  <View style={[styles.pilgrimMetricCard, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
                    <MaterialCommunityIcons name="content-cut" size={14} color={accent} />
                    <ThemedText style={[styles.ssdMetricLabel, { textAlign: 'center' }]}>Tonsures</ThemedText>
                    <ThemedText style={[styles.pilgrimMetricValue, { color: accent }]}>{item.tonsures}</ThemedText>
                  </View>
                  <View style={[styles.pilgrimMetricCard, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={14} color={accent} />
                    <ThemedText style={[styles.ssdMetricLabel, { textAlign: 'center' }]}>Hundi</ThemedText>
                    <ThemedText style={[styles.pilgrimMetricValue, { color: accent }]}>{expandHundi(item.hundi)}</ThemedText>
                  </View>
                  <View style={[styles.pilgrimMetricCard, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
                    <MaterialCommunityIcons name="timer-sand" size={14} color={accent} />
                    <ThemedText style={[styles.ssdMetricLabel, { textAlign: 'center' }]}>Darshan</ThemedText>
                    <ThemedText style={[styles.pilgrimMetricValue, { color: accent }]}>{expandDarshanTime(item.time)}</ThemedText>
                  </View>
                </View>

                {/* Waiting box */}
                <View style={[styles.ssdNoteBox, { borderColor: accent + '35', backgroundColor: accent + '0D' }]}>
                  <MaterialCommunityIcons name="map-marker-path" size={14} color={accent} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText style={{ fontSize: 10, fontWeight: '700', color: accent, letterSpacing: 0.3 }}>QUEUE / WAITING POSITION</ThemedText>
                    <ThemedText style={styles.ssdNoteText}>{item.waiting}</ThemedText>
                  </View>
                </View>
              </ThemedView>
            </Animated.View>
            );
          }}
        />
      ) : activeTab === 'ssd' ? (
        <FlatList
          key="ssd-list"
          data={SSD_TOKEN_INFO}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ssdListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Animated.View entering={FadeInDown.duration(280)} style={styles.bannerWrap}>
                <Image
                  source={require('../../assets/images/banner-image.png')}
                  style={styles.bannerImage}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(420)} style={styles.ssdHeaderWrap}>
              <ThemedView style={[styles.ssdHeaderCard, { borderColor: tintColor + '55', backgroundColor: tintColor + '0E' }]}>

                {/* ── Top: icon + title + LIVE badge ── */}
                <View style={styles.ssdTitleRow}>
                  <LinearGradient
                    colors={[tintColor + 'FF', tintColor + 'AA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.ssdTitleIconWrap}
                  >
                    <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText style={{ fontSize: 10, fontWeight: '700', color: tintColor, letterSpacing: 1.1, textTransform: 'uppercase' }}>Free Darshan Ticket</ThemedText>
                    <ThemedText style={{ fontSize: 16, fontWeight: '900' }}>SSD Token</ThemedText>
                    <ThemedText style={[styles.ssdTitleSubtext, { color: tintColor }]}>Updated: {ssdDisplayDate}</ThemedText>
                  </View>
                  <BlinkingDot label="LIVE" />
                </View>

                {/* ── Balance tickets hero ── */}
                <LinearGradient
                  colors={[tintColor + 'FF', tintColor + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.ssdBalanceHero}
                >
                  <View style={{ gap: 3 }}>
                    <ThemedText style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 0.8 }}>BALANCE TICKETS</ThemedText>
                    <ThemedText style={{ fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 56 }}>{liveSsd.balanceTickets}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>available for {liveSsd.balanceDate ?? ssdDisplayDate}</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center', justifyContent: 'center', opacity: 0.25 }}>
                    <MaterialCommunityIcons name="ticket-percent-outline" size={72} color="#fff" />
                  </View>
                </LinearGradient>

                {/* ── View locations button ── */}
                <SsdLocationsButton tintColor={tintColor} />

                {/* ── Divider ── */}
                <View style={{ height: 1, backgroundColor: tintColor + '30' }} />

                {/* ── Running slot info ── */}
                <View style={{ borderRadius: 14, borderWidth: 1, borderColor: tintColor + '30', backgroundColor: tintColor + '0C', overflow: 'hidden' }}>
                  <View style={{ height: 3, backgroundColor: tintColor + '90' }} />
                  <View style={{ padding: 14, gap: 10 }}>
                    {/* Label + active badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.9, opacity: 0.55, textTransform: 'uppercase' }}>Currently Running Slot</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4CAF5020', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#4CAF5055' }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50' }} />
                        <ThemedText style={{ fontSize: 9, fontWeight: '800', color: '#4CAF50', letterSpacing: 0.5 }}>ACTIVE</ThemedText>
                      </View>
                    </View>
                    {/* Slot number card + info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <LinearGradient
                        colors={[tintColor + 'EE', tintColor + 'AA']}
                        style={{ width: 76, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ThemedText style={{ fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 }}>{liveSsd.runningSlot}</ThemedText>
                      </LinearGradient>
                      <View style={{ flex: 1, gap: 5 }}>
                        <ThemedText style={{ fontSize: 14, fontWeight: '800', color: tintColor }}>Currently Running</ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.55 }}>{liveSsd.slotDate ?? ssdDisplayDate}</ThemedText>
                        <ThemedText style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, opacity: 0.22, textTransform: 'uppercase', marginTop: 2 }}>Tirumala</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── Note box ── */}
                <View style={[styles.ssdNoteBox, { borderColor: tintColor + '35', backgroundColor: tintColor + '0A' }]}>
                  <MaterialCommunityIcons name="information-outline" size={15} color={tintColor} style={{ marginTop: 1 }} />
                  <ThemedText style={[styles.ssdNoteText, { opacity: 0.7 }]}>
                    Live ticket status may vary by the time pilgrim reaches the counter. Issued on first-come-first-serve basis.
                  </ThemedText>
                </View>

              </ThemedView>
            </Animated.View>
            </>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(360)}>
              <View style={[styles.recentCard, { borderColor }]}>
                <View style={[styles.recentAccentBar, { backgroundColor: tintColor }]} />
                <View style={[styles.recentCardBody, { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }]}>
                  <View style={[styles.ssdInfoIconCircle, { backgroundColor: tintColor + '28' }]}>
                    <MaterialCommunityIcons name={item.icon} size={24} color={tintColor} />
                  </View>
                  <View style={styles.ssdInfoContent}>
                    <ThemedText type="defaultSemiBold" style={[styles.ssdInfoTitle, { color: tintColor }]}>{item.title}</ThemedText>
                    <ThemedText style={styles.ssdInfoDetail}>{item.detail}</ThemedText>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          key="schedule-list"
          data={effectiveDaySchedule.schedules}
          keyExtractor={(item, index) => `${item.time}-${item.event}-${index}`}
          contentContainerStyle={styles.scheduleListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Animated.View entering={FadeInDown.duration(280)} style={styles.bannerWrap}>
                <Image
                  source={require('../../assets/images/banner-image.png')}
                  style={styles.bannerImage}
                  contentFit="cover"
                  contentPosition="center"
                  transition={200}
                />
              </Animated.View>

              {/* ── Current / upcoming sevas carousel ── */}
              <CurrentSevaCarousel schedules={effectiveDaySchedule.schedules} tintColor={'#6b80ef'} />

              <LinearGradient
                colors={['#2d1b7a', '#5240c4','#6252d0', '#9D8FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scheduleDateHeader}
              >
                {/* Top row: icon + title + event count */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="calendar-clock" size={24} color="#fff" />
                    </View>
                    <View style={{ gap: 1 }}>
                      <ThemedText style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>Temple Schedule</ThemedText>
                      <ThemedText style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.2 }}>Today's Sevas</ThemedText>
                    </View>
                  </View>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 1 }}>
                    <ThemedText style={{ fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 24 }}>
                      {effectiveDaySchedule.schedules.length}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: 'rgba(255,255,255,0.70)', letterSpacing: 1, fontWeight: '700' }}>EVENTS</ThemedText>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 14, marginBottom: 12 }} />

                {/* Bottom row: day pill + date pill */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <MaterialCommunityIcons name="weather-sunny" size={13} color="#fff" />
                    <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{effectiveDaySchedule.day}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <MaterialCommunityIcons name="calendar-today" size={13} color="#fff" />
                    <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{effectiveDaySchedule.date}</ThemedText>
                  </View>
                </View>
              </LinearGradient>
            </>
          }
          renderItem={({ item }) => {
            const timePart = item.time;
            const displayTime = formatScheduleTime12h(timePart);
            const sevaName = item.event;
            const status = getScheduleStatus(timePart);

            const cardBg =
              status === 'past' ? '#FF6B6B38' :
              status === 'current' ? '#4CAF5038' :
              undefined;
            const accentColor =
              status === 'past' ? '#E05050' :
              status === 'current' ? '#4CAF50' :
              '#6b80ef';
            const pillBg =
              status === 'past' ? '#FF6B6B40' :
              status === 'current' ? '#4CAF5040' :
              '#6b80ef1A';

            return (
              <View style={[styles.recentCard, { borderColor }, cardBg ? { backgroundColor: cardBg } : {}]}>
                <View style={[styles.recentAccentBar, { backgroundColor: accentColor }]} />
                <View style={styles.recentCardBody}>
                  <View style={[styles.scheduleTimePill, { backgroundColor: pillBg, alignSelf: 'flex-start' }]}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={12} color={accentColor} style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.scheduleTimeText, { color: accentColor }]}>{displayTime}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.scheduleSevaName}>{sevaName}</ThemedText>
                  {status === 'current' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' }} />
                      <ThemedText style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>In Progress</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

function CurrentSevaCarousel({ schedules, tintColor }: { schedules: DayScheduleItem[]; tintColor: string }) {
  const { width } = useWindowDimensions();
  const CARD_W = width - 12 * 2 - 32;
  const PEEK = 20;

  const relevant = schedules
    .map((s, i) => ({ ...s, _idx: i, status: getScheduleStatus(s.time) }))
    .filter(s => s.status === 'current' || s.status === 'upcoming')
    .sort((a, b) => (a.status === 'current' ? -1 : 1) - (b.status === 'current' ? -1 : 1))
    .slice(0, 5);

  if (relevant.length === 0) return null;

  return (
    <View style={{ marginTop: 4, marginBottom: 12 }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <LinearGradient
            colors={['#4CAF50', '#22c55e']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: 4, height: 16, borderRadius: 2 }}
          />
          <ThemedText style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>Active &amp; Upcoming</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,222,128,0.30)' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
          <ThemedText style={{ fontSize: 9, fontWeight: '800', color: '#22c55e', letterSpacing: 0.5 }}>LIVE</ThemedText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 10}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: PEEK + 10 }}
      >
        {relevant.map((item, i) => {
          const isCurrent = item.status === 'current';
          const displayTime = formatScheduleTime12h(item.time);

          if (isCurrent) {
            return (
              <LinearGradient
                key={item._idx}
                colors={['#052e16', '#14532d', '#166534']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: CARD_W, borderRadius: 16, padding: 14, gap: 0, marginRight: 10, overflow: 'hidden' }}
              >
                {/* decorative bubbles */}
                <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', opacity: 0.04, top: -20, right: -16 }} />
                <View style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', opacity: 0.05, bottom: -10, left: 14 }} />

                {/* pill */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(74,222,128,0.20)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.40)', marginBottom: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', shadowColor: '#4ade80', shadowRadius: 4, shadowOpacity: 1 }} />
                  <MaterialCommunityIcons name="play-circle-outline" size={12} color="#4ade80" />
                  <ThemedText style={{ fontSize: 9, fontWeight: '800', color: '#4ade80', letterSpacing: 0.7 }}>IN PROGRESS</ThemedText>
                </View>

                {/* event name */}
                <ThemedText style={{ fontSize: 15, fontWeight: '900', color: '#fff', lineHeight: 20, marginBottom: 8 }} numberOfLines={2}>
                  {item.event}
                </ThemedText>

                {/* time row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={13} color="rgba(255,255,255,0.8)" />
                    <ThemedText style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{displayTime}</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Happening now</ThemedText>
                </View>
              </LinearGradient>
            );
          }

          // upcoming card
          return (
            <View
              key={item._idx}
              style={{ width: CARD_W, borderRadius: 16, borderWidth: 1, borderColor: tintColor + '35', backgroundColor: tintColor + '0D', padding: 14, gap: 0, marginRight: 10, overflow: 'hidden' }}
            >
              {/* accent top bar */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tintColor + '80', borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />

              {/* pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: tintColor + '18', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: tintColor + '40', marginBottom: 10, marginTop: 4 }}>
                <MaterialCommunityIcons name="clock-outline" size={11} color={tintColor} />
                <ThemedText style={{ fontSize: 9, fontWeight: '800', color: tintColor, letterSpacing: 0.7 }}>UPCOMING</ThemedText>
              </View>

              {/* event name */}
              <ThemedText style={{ fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 8 }} numberOfLines={2}>
                {item.event}
              </ThemedText>

              {/* time row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: tintColor + '18', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={12} color={tintColor} />
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: tintColor }}>{displayTime}</ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SsdLocationsButton({ tintColor }: { tintColor: string }) {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scaleAnim, { toValue: 1.03, duration: 750, useNativeDriver: true }),
        RNAnimated.timing(scaleAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => router.push('/ssd-locations')}
        onPressIn={() => RNAnimated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => RNAnimated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, borderRadius: 16, overflow: 'hidden' })}>
        <LinearGradient
          colors={[tintColor, tintColor + 'BB', tintColor + 'EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, padding: 16, overflow: 'hidden' }}
        >
          {/* decorative blobs */}
          <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', opacity: 0.05, top: -30, right: -20 }} />
          <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', opacity: 0.07, bottom: -16, left: 10 }} />
          <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', opacity: 0.10, top: 10, right: 52 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' }}>
              <MaterialCommunityIcons name="map-marker-radius" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <ThemedText style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.2 }}>Counter Locations</ThemedText>
              <ThemedText style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 15 }}>
                Find all physical SSD token counters near you
              </ThemedText>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </RNAnimated.View>
  );
}

function BlinkingDot({ label }: { label: string }) {
  const GREEN = '#4CAF50';
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0.8);

  useEffect(() => {
    ringScale.value = withRepeat(withTiming(2.6, { duration: 1300 }), -1, false);
    ringOpacity.value = withRepeat(withTiming(0, { duration: 1300 }), -1, false);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN + '1A', borderWidth: 1, borderColor: GREEN + '50', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
      <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: GREEN }, ringStyle]} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN }} />
      </View>
      <ThemedText style={{ fontSize: 10, fontWeight: '800', color: GREEN, letterSpacing: 0.8 }}>{label}</ThemedText>
    </View>
  );
}

function SubTabButton({
  label,
  active,
  onPress,
  tintColor,
  colorScheme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tintColor: string;
  colorScheme: 'light' | 'dark';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.subTabButton,
        active ? { backgroundColor: tintColor + '20', borderColor: tintColor } : { borderColor: 'transparent' },
        { opacity: pressed ? 0.75 : 1 },
      ]}>
      <ThemedText style={[styles.subTabText, active ? { color: colorScheme === 'dark' ? '#fff' : '#000000', fontWeight: '700' } : { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.65)' : '#000000', opacity: 1 }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MetricChip({
  icon,
  label,
  value,
  tintColor,
  borderColor,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  tintColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.metricChip, { borderColor: borderColor + '80' }]}>
      <MaterialCommunityIcons name={icon} size={13} color={tintColor} />
      <ThemedText style={[styles.metricChipValue, { color: tintColor }]}>{value}</ThemedText>
      <ThemedText style={styles.metricChipLabel}>{label}</ThemedText>
    </View>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.heroStatBlock}>
      <MaterialCommunityIcons name={icon} size={19} color="rgba(255,255,255,0.75)" />
      <ThemedText style={styles.heroStatValue}>{value}</ThemedText>
      <ThemedText style={styles.heroStatLabel}>{label}</ThemedText>
    </View>
  );
}

function RecentStat({
  icon,
  label,
  value,
  tintColor,
  borderColor,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  tintColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.recentStatBlock, { borderColor: borderColor + '60', backgroundColor: tintColor + '0D' }]}>
      <MaterialCommunityIcons name={icon} size={16} color={tintColor} />
      <ThemedText style={[styles.recentStatValue, { color: tintColor }]}>{value}</ThemedText>
      <ThemedText style={styles.recentStatLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#4CAF50', letterSpacing: 0.8 },
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  banner: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  bannerWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  bannerImage: { width: '100%', height: 165 },
  bannerOverlay: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  bannerText: { fontSize: 13 },
  subTabsWrap: { borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row' },
  subTabButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  subTabText: { fontSize: 11 },
  // Pilgrim Updates
  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 12 },
  cardWrap: { width: '100%' },
  featuredWrap: { marginBottom: 4 },
  // Hero gradient card
  heroCard: { borderRadius: 22, padding: 18, gap: 16 },
  miniHeroCard: { borderRadius: 18, padding: 14, gap: 12 },
  miniHeroPilgrimsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniHeroPilgrimsCount: { fontSize: 15, fontWeight: '800', color: '#fff' },
  miniHeroPilgrimsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 2 },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDatePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  heroDateText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  heroCountSection: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCountIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroCount: { fontSize: 38, fontWeight: '900', color: '#fff', lineHeight: 43 },
  heroCountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'stretch' },
  heroStatSeparator: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)' },
  heroStatBlock: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 4 },
  heroStatValue: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 18 },
  heroStatLabel: { fontSize: 9.5, color: 'rgba(255,255,255,0.62)', letterSpacing: 0.3, textAlign: 'center' },
  heroWaitingBox: { backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 12, padding: 12, gap: 6 },
  heroWaitingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroWaitingTitle: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  heroWaitingValue: { fontSize: 13, color: '#fff', lineHeight: 19 },
  // Recent section header
  recentSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: -4 },
  recentSectionAccent: { width: 3, height: 16, borderRadius: 2 },
  recentSectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  recentSectionSub: { fontSize: 11, opacity: 0.5, marginLeft: 2 },
  pilgrimCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  pilgrimMetricCard: { flex: 1, borderWidth: 1, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  pilgrimMetricValue: { fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  // Recent cards
  recentCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  recentAccentBar: { width: 4 },
  recentCardBody: { flex: 1, padding: 12, gap: 10 },
  recentTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentDate: { fontSize: 13, fontWeight: '700' },
  recentPilgrimsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentPilgrimsCount: { fontSize: 16, fontWeight: '800' },
  recentPilgrimsLabel: { fontSize: 10, opacity: 0.55, marginTop: 3 },
  recentStatsRow: { flexDirection: 'row', gap: 6 },
  recentStatBlock: { flex: 1, borderWidth: 1, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  recentStatValue: { fontSize: 11.5, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  recentStatLabel: { fontSize: 9.5, opacity: 0.62, textAlign: 'center' },
  recentWaitingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, borderTopWidth: 1, paddingTop: 9 },
  recentWaitingLabel: { fontSize: 11.5, fontWeight: '700', marginTop: 0.5 },
  recentWaitingValue: { flex: 1, fontSize: 11.5, lineHeight: 17, opacity: 0.82 },
  featuredCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 16, padding: 14, gap: 10 },
  featuredHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  todayBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  pilgrimsHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pilgrimsHeroIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  pilgrims: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  pilgrimLabel: { fontSize: 12, lineHeight: 17, opacity: 0.7 },
  inlineCount: { fontSize: 14, fontWeight: '700' },
  metricChipsRow: { flexDirection: 'row', gap: 8 },
  metricChip: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center', gap: 3 },
  metricChipValue: { fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'center' },
  metricChipLabel: { fontSize: 10, lineHeight: 14, opacity: 0.65, textAlign: 'center' },
  waitingBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  waitingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waitingTitle: { fontSize: 12, fontWeight: '600' },
  waitingValue: { fontSize: 12, lineHeight: 17 },
  infoDetail: { fontSize: 14, lineHeight: 20 },
  // Day Schedule
  scheduleListContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 10 },
  scheduleDateHeader: { borderRadius: 18, padding: 18, marginBottom: 6 },
  scheduleDateTitle: { fontSize: 15 },
  scheduleDateSubtext: { fontSize: 12, lineHeight: 17, opacity: 0.7 },
  scheduleCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12, gap: 6 },
  scheduleTimePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  scheduleTimeText: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
  scheduleSevaName: { fontSize: 14, lineHeight: 20 },
  scheduleDetail: { fontSize: 12, lineHeight: 17, opacity: 0.75 },
  // SSD Token
  ssdListContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 10 },
  ssdInfoCard: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ssdInfoIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  ssdInfoContent: { flex: 1, gap: 5 },
  ssdInfoTitle: { fontSize: 14 },
  ssdInfoDetail: { fontSize: 13, lineHeight: 19, opacity: 0.8 },
  ssdHeaderWrap: { marginBottom: 12 },
  ssdBalanceHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 18, overflow: 'hidden' },
  ssdHeaderCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 16 },
  ssdTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ssdTitleIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  ssdTitleSubtext: { fontSize: 11, lineHeight: 15, opacity: 0.65 },
  ssdStatusBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  ssdStatusDot: { width: 6, height: 6, borderRadius: 3 },
  ssdStatusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  ssdMetricsRow: { flexDirection: 'row', gap: 10 },
  ssdMetricCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, gap: 4, alignItems: 'center' },
  ssdMetricLabel: { fontSize: 11, lineHeight: 15, opacity: 0.7, textAlign: 'center' },
  ssdMetricValue: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  ssdMetricSubtext: { fontSize: 10, lineHeight: 14, opacity: 0.6, textAlign: 'center' },
  ssdNoteBox: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  ssdNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  ssdLocationsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  ssdLocationsBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  // unused but kept for safety
  column: { gap: 12 },
  compactCard: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  statsGroup: { gap: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13 },
  compactPilgrimsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compactPilgrims: { fontSize: 20, fontWeight: '700' },
  compactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactMetaText: { fontSize: 12, marginRight: 6 },
  compactWaitingText: { fontSize: 12 },
  pilgrimsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  scheduleCardContent: { flex: 1, gap: 5 },
});
