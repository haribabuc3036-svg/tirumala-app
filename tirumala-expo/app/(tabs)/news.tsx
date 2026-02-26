import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

const DAY_SCHEDULE_DATA: DayScheduleData = {
  date: '2026-02-26',
  day: 'Thursday',
  schedules: [
    { event: 'Suprabhatam', time: '02:30 - 03:00 hrs' },
    { event: 'Thomala Seva', time: '03:30 - 04:00 hrs' },
    { event: 'Koluvu and Panchanga Sravanam', time: '04:00 - 04:15 hrs' },
    { event: 'First Archana', time: '04:15 - 05:00 hrs' },
    { event: 'Abhishekam and second Archana', time: '06:00 - 08:00 hrs' },
    { event: 'Darshanam', time: '09:30 - 19:00 hrs' },
    { event: 'Arjitha Sevas', time: '12:00 - 17:00 hrs' },
    { event: 'Sahasra Deepalankarana Seva', time: '17:30 - 18:30 hrs' },
    { event: 'Suddhi and Night Kainkaryams', time: '19:00 - 20:00 hrs' },
    { event: 'Darshanam', time: '20:00 - 00:30 hrs' },
    { event: 'Suddhi and preparation for Ekanta Seva', time: '00:30 - 00:45 hrs' },
    { event: 'Ekanta Seva', time: '00:45 hrs' },
  ],
};

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = Colors[colorScheme].icon;
  const tintColor = MainTabAccent.news;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NewsSubTab>('pilgrims');

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
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="temple-hindu" size={24} color={tintColor} />
          <ThemedText type="title">Darshan News</ThemedText>
          {liveLoading ? (
            <ActivityIndicator size="small" color={tintColor} style={{ marginLeft: 4 }} />
          ) : isLive ? (
            <View style={[styles.liveBadge, { backgroundColor: '#4CAF5022', borderColor: '#4CAF5060' }]}>
              <View style={[styles.liveDot, { backgroundColor: '#4CAF50' }]} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText>Daily TTD crowd, tonsure, hundi and darshan-time updates.</ThemedText>


        <View style={[styles.subTabsWrap, { borderColor }]}>
          <SubTabButton label="Pilgrim Updates" active={activeTab === 'pilgrims'} onPress={() => setActiveTab('pilgrims')} tintColor={tintColor} />
          <SubTabButton label="Day Schedules" active={activeTab === 'schedule'} onPress={() => setActiveTab('schedule')} tintColor={tintColor} />
          <SubTabButton label="SSD Token" active={activeTab === 'ssd'} onPress={() => setActiveTab('ssd')} tintColor={tintColor} />
        </View> 
      </View>

      {activeTab === 'pilgrims' ? (
        <FlatList
          key="pilgrims-list"
          data={olderNews}
          keyExtractor={(item) => item.date}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(450)} style={styles.featuredWrap}>
              <ThemedView style={[styles.featuredCard, { borderColor, borderLeftColor: tintColor, backgroundColor: tintColor + '10' }]}>
                <View style={styles.featuredHeaderRow}>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="star-circle" size={16} color={tintColor} />
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{latestNews.date}</ThemedText>
                  </View>
                  <View style={[styles.todayBadge, { backgroundColor: tintColor, borderColor: tintColor }]}>
                    <ThemedText style={styles.todayBadgeText}>{latestBadgeText}</ThemedText>
                  </View>
                </View>

                <View style={styles.pilgrimsHeroRow}>
                  <View style={[styles.pilgrimsHeroIconWrap, { backgroundColor: tintColor + '20' }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={28} color={tintColor} />
                  </View>
                  <View>
                    <ThemedText style={[styles.pilgrims, { color: tintColor }]}>{latestNews.pilgrims}</ThemedText>
                    <ThemedText style={styles.pilgrimLabel}>Pilgrims had darshan</ThemedText>
                  </View>
                </View>

                <View style={styles.metricChipsRow}>
                  <MetricChip icon="content-cut" label="Tonsures" value={latestNews.tonsures} tintColor={tintColor} borderColor={borderColor} />
                  <MetricChip icon="cash-multiple" label="Hundi" value={latestNews.hundi} tintColor={tintColor} borderColor={borderColor} />
                  <MetricChip icon="timer-sand" label="Darshan" value={latestNews.time} tintColor={tintColor} borderColor={borderColor} />
                </View>

                <View style={[styles.waitingBox, { borderColor: tintColor + '40', backgroundColor: tintColor + '0A' }]}>
                  <View style={styles.waitingTitleRow}>
                    <MaterialCommunityIcons name="map-marker-path" size={14} color={tintColor} />
                    <ThemedText type="defaultSemiBold" style={[styles.waitingTitle, { color: tintColor }]}>Queue / Waiting</ThemedText>
                  </View>
                  <ThemedText style={styles.waitingValue}>{latestNews.waiting}</ThemedText>
                </View>
              </ThemedView>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay((index + 1) * 60).duration(360)} style={styles.cardWrap}>
              <ThemedView style={[styles.featuredCard, { borderColor, borderLeftColor: tintColor }]}>
                <View style={styles.featuredHeaderRow}>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={14} color={tintColor} />
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>{item.date}</ThemedText>
                  </View>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color={tintColor} />
                    <ThemedText style={[styles.inlineCount, { color: tintColor }]}>{item.pilgrims}</ThemedText>
                  </View>
                </View>

                <View style={styles.metricChipsRow}>
                  <MetricChip icon="content-cut" label="Tonsures" value={item.tonsures} tintColor={tintColor} borderColor={borderColor} />
                  <MetricChip icon="cash-multiple" label="Hundi" value={item.hundi} tintColor={tintColor} borderColor={borderColor} />
                  <MetricChip icon="timer-sand" label="Darshan" value={item.time} tintColor={tintColor} borderColor={borderColor} />
                </View>

                <View style={[styles.waitingBox, { borderColor: borderColor + '80' }]}>
                  <View style={styles.waitingTitleRow}>
                    <MaterialCommunityIcons name="map-marker-path" size={13} color={tintColor} />
                    <ThemedText style={[styles.waitingTitle, { opacity: 0.7 }]}>Waiting</ThemedText>
                  </View>
                  <ThemedText style={styles.waitingValue}>{item.waiting}</ThemedText>
                </View>
              </ThemedView>
            </Animated.View>
          )}
        />
      ) : activeTab === 'ssd' ? (
        <FlatList
          key="ssd-list"
          data={SSD_TOKEN_INFO}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ssdListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(420)} style={styles.ssdHeaderWrap}>
              <ThemedView style={[styles.ssdHeaderCard, { borderColor, backgroundColor: tintColor + '12' }]}>
                <View style={styles.ssdTitleRow}>
                  <View style={[styles.ssdTitleIconWrap, { backgroundColor: tintColor + '20' }]}>
                    <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color={tintColor} />
                  </View>
                  <View style={{ gap: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>SSD Token (Free Tickets)</ThemedText>
                    <ThemedText style={styles.ssdTitleSubtext}>As of {ssdDisplayDate}</ThemedText>
                  </View>
                  <View style={[styles.ssdStatusBadge, { backgroundColor: isSoldOut ? '#FF6B6B22' : '#4CAF5022', borderColor: isSoldOut ? '#FF6B6B55' : '#4CAF5055' }]}>
                    <View style={[styles.ssdStatusDot, { backgroundColor: isSoldOut ? '#FF6B6B' : '#4CAF50' }]} />
                    <ThemedText style={[styles.ssdStatusBadgeText, { color: isSoldOut ? '#FF6B6B' : '#4CAF50' }]}>
                      {isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.ssdMetricsRow}>
                  <View style={[styles.ssdMetricCard, { borderColor, backgroundColor: tintColor + '18' }]}>
                    <ThemedText style={styles.ssdMetricLabel}>Running Slot</ThemedText>
                    <ThemedText type="title" style={[styles.ssdMetricValue, { color: tintColor }]}>
                      {liveSsd.runningSlot}
                    </ThemedText>
                    <ThemedText style={styles.ssdMetricSubtext}>on {liveSsd.slotDate ?? ssdDisplayDate}</ThemedText>
                  </View>

                  <View style={[styles.ssdMetricCard, { borderColor, backgroundColor: isSoldOut ? '#FF6B6B14' : tintColor + '18' }]}>
                    <ThemedText style={styles.ssdMetricLabel}>Balance Tickets</ThemedText>
                    <ThemedText type="title" style={[styles.ssdMetricValue, { color: isSoldOut ? '#FF6B6B' : tintColor }]}>
                      {liveSsd.balanceTickets}
                    </ThemedText>
                    <ThemedText style={styles.ssdMetricSubtext}>for {liveSsd.balanceDate ?? ssdDisplayDate}</ThemedText>
                  </View>
                </View>

                <View style={[styles.ssdNoteBox, { borderColor: '#FF6B6B44', backgroundColor: '#FF6B6B0E' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF6B6B" />
                  <ThemedText style={[styles.ssdNoteText, { color: undefined }]}>
                    Live tickets status may vary by the time pilgrim reaches physically at the counters.
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => router.push('/ssd-locations')}
                  style={({ pressed }) => [styles.ssdLocationsBtn, { backgroundColor: pressed ? tintColor + 'CC' : tintColor }]}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color="#fff" />
                  <ThemedText style={styles.ssdLocationsBtnText}>View Physical Counter Locations</ThemedText>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
                </Pressable>
              </ThemedView>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(360)}>
              <ThemedView style={[styles.ssdInfoCard, { borderColor, backgroundColor: tintColor + '0D' }]}>
                <View style={[styles.ssdInfoIconCircle, { backgroundColor: tintColor + '28' }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={tintColor} />
                </View>
                <View style={styles.ssdInfoContent}>
                  <ThemedText type="defaultSemiBold" style={[styles.ssdInfoTitle, { color: tintColor }]}>{item.title}</ThemedText>
                  <ThemedText style={styles.ssdInfoDetail}>{item.detail}</ThemedText>
                </View>
              </ThemedView>
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
            <ThemedView style={[styles.scheduleDateHeader, { borderColor, backgroundColor: tintColor + '14' }]}> 
              <View style={{ gap: 2 }}>
                <ThemedText type="defaultSemiBold" style={[styles.scheduleDateTitle, { color: tintColor }]}>Today's Schedule</ThemedText>
                <ThemedText style={styles.scheduleDateSubtext}>{effectiveDaySchedule.day} • {effectiveDaySchedule.date}</ThemedText>
              </View>
            </ThemedView>
          }
          renderItem={({ item }) => {
            const timePart = item.time;
            const sevaName = item.event;

            return (
              <ThemedView style={[styles.scheduleCard, { borderColor, borderLeftColor: tintColor }]}> 
                <View style={[styles.scheduleTimePill, { backgroundColor: tintColor + '1A' }]}> 
                  <ThemedText style={[styles.scheduleTimeText, { color: tintColor }]}>{timePart}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={styles.scheduleSevaName}>{sevaName}</ThemedText>
              </ThemedView>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

function SubTabButton({
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
        styles.subTabButton,
        active ? { backgroundColor: tintColor + '20', borderColor: tintColor } : { borderColor: 'transparent' },
        { opacity: pressed ? 0.75 : 1 },
      ]}>
      <ThemedText style={[styles.subTabText, active ? { color: tintColor, fontWeight: '700' } : { opacity: 0.6 }]}>
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

const styles = StyleSheet.create({
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#4CAF50', letterSpacing: 0.8 },
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  banner: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  bannerImage: { width: '100%', height: 120 },
  bannerOverlay: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  bannerText: { fontSize: 13 },
  subTabsWrap: { borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row' },
  subTabButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  subTabText: { fontSize: 11 },
  // Pilgrim Updates
  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 12 },
  cardWrap: { width: '100%' },
  featuredWrap: { marginBottom: 4 },
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
  scheduleDateHeader: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 4 },
  scheduleDateTitle: { fontSize: 15 },
  scheduleDateSubtext: { fontSize: 12, lineHeight: 17, opacity: 0.7 },
  scheduleCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12, gap: 6 },
  scheduleTimePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
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
  ssdHeaderCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  ssdTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ssdTitleIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
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
