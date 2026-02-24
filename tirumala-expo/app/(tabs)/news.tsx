import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { type ComponentProps, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
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

const DARSHAN_NEWS: DarshanNewsItem[] = [
  { date: '23.02.2026', pilgrims: '77,803', tonsures: '27,766', hundi: '4.66 CR', waiting: '31 Compartments', time: '18H' },
  { date: '22.02.2026', pilgrims: '76,506', tonsures: '28,049', hundi: '4.20 CR', waiting: '25 Compartments', time: '15H' },
  { date: '21.02.2026', pilgrims: '82,043', tonsures: '32,299', hundi: '3.74 CR', waiting: 'Outside line at Krishna Teja Guest house', time: '16H' },
  { date: '20.02.2026', pilgrims: '68,156', tonsures: '28,295', hundi: '3.46 CR', waiting: 'Outside line at Sila thoranam', time: '18-20H' },
  { date: '19.02.2026', pilgrims: '57,682', tonsures: '27,020', hundi: '3.65 CR', waiting: 'Outside line at Krishna Teja Guest house', time: '10-12H' },
  { date: '18.02.2026', pilgrims: '63,804', tonsures: '24,142', hundi: '3.90 CR', waiting: '14 Compartments', time: '10-12H' },
  { date: '17.02.2026', pilgrims: '70,509', tonsures: '18,058', hundi: '4.20 CR', waiting: '04 Compartments', time: '06H' },
  { date: '16.02.2026', pilgrims: '73,776', tonsures: '23,291', hundi: '4.42 CR', waiting: '13 Compartments', time: '08H' },
  { date: '15.02.2026', pilgrims: '80,502', tonsures: '24,608', hundi: '3.74 CR', waiting: '18 Compartments', time: '8-10H' },
  { date: '14.02.2026', pilgrims: '82,337', tonsures: '30,825', hundi: '3.58 CR', waiting: 'Outside line at ATGH', time: '12H' },
];

const SSD_STATUS = {
  runningSlot: '12',
  date: '25-Feb-2026',
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

const DAY_SCHEDULE_INFO: InfoItem[] = [
  {
    id: '1',
    title: '02:30 - 03:00 hrs • Suprabhatam',
    detail: 'Start of the temple daily schedule.',
    icon: 'weather-sunset-up',
  },
  {
    id: '2',
    title: '03:30 - 04:00 hrs • Thomala Seva',
    detail: 'Morning seva in the early hours.',
    icon: 'calendar-clock-outline',
  },
  {
    id: '3',
    title: '04:00 - 04:15 hrs • Koluvu and Panchanga Sravanam',
    detail: 'Inside Bangaru Vakili (Ekantam).',
    icon: 'book-open-variant-outline',
  },
  {
    id: '4',
    title: '04:15 - 05:00 hrs • First Archana',
    detail: 'Sahasranama Archana (Ekantam).',
    icon: 'hands-pray',
  },
  {
    id: '5',
    title: '06:00 - 08:00 hrs • Abhishekam & Second Archana',
    detail: 'SahasraKalasa Abhishekam, Second Archana (Ekantam) and Bell.',
    icon: 'bell-outline',
  },
  {
    id: '6',
    title: '09:30 - 19:00 hrs • Darshanam',
    detail: 'Main darshan window through daytime.',
    icon: 'account-group-outline',
  },
  {
    id: '7',
    title: '12:00 - 17:00 hrs • Arjitha Sevas',
    detail: 'Kalyanostavam, Brahmostavam, Vasanthostavam, Unjal Seva.',
    icon: 'flower-outline',
  },
  {
    id: '8',
    title: '17:30 - 18:30 hrs • Sahasra Deepalankarana Seva',
    detail: 'Evening seva period.',
    icon: 'candle',
  },
  {
    id: '9',
    title: '19:00 - 20:00 hrs • Suddhi & Night Kainkaryams',
    detail: 'Ekantam and Night Bell.',
    icon: 'weather-night',
  },
  {
    id: '10',
    title: '20:00 - 00:30 hrs • Darshanam',
    detail: 'Night darshan window.',
    icon: 'clock-time-eight-outline',
  },
  {
    id: '11',
    title: '00:30 - 00:45 hrs • Suddhi & Preparation',
    detail: 'Preparations for Ekanta Seva.',
    icon: 'wrench-clock',
  },
  {
    id: '12',
    title: '00:45 hrs • Ekanta Seva',
    detail: 'Final seva of the day.',
    icon: 'weather-night',
  },
];

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = Colors[colorScheme].icon;
  const tintColor = Colors[colorScheme].tint;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NewsSubTab>('pilgrims');
  const [latestNews, ...olderNews] = DARSHAN_NEWS;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="temple-hindu" size={24} color={tintColor} />
          <ThemedText type="title">Darshan News</ThemedText>
        </View>
        <ThemedText>Daily TTD crowd, tonsure, hundi and darshan-time updates.</ThemedText>

        <View style={[styles.banner, { borderColor }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1400&q=80' }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={tintColor} />
            <ThemedText type="defaultSemiBold" style={styles.bannerText}>
              Latest Daily Darshan Snapshot
            </ThemedText>
          </View>
        </View>

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
              <ThemedView style={[styles.featuredCard, { borderColor, backgroundColor: tintColor + '18' }]}>
                <View style={styles.featuredHeaderRow}>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="star-circle" size={16} color={tintColor} />
                    <ThemedText type="defaultSemiBold">Today • {latestNews.date}</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="clock-check-outline" size={16} color={tintColor} />
                </View>

                <View style={styles.pilgrimsRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={24} color={tintColor} />
                  <View>
                    <ThemedText style={[styles.pilgrims, { color: tintColor }]}>{latestNews.pilgrims}</ThemedText>
                    <ThemedText style={styles.pilgrimLabel}>Pilgrims had darshan</ThemedText>
                  </View>
                </View>

                <View style={styles.statsGroup}>
                  <StatRow label="Tonsures" value={latestNews.tonsures} icon="content-cut" tintColor={tintColor} />
                  <StatRow label="Hundi" value={latestNews.hundi} icon="cash-multiple" tintColor={tintColor} />
                  <StatRow label="Darshan" value={latestNews.time} icon="timer-sand" tintColor={tintColor} />
                </View>

                <View style={[styles.waitingBox, { borderColor }]}>
                  <View style={styles.waitingTitleRow}>
                    <MaterialCommunityIcons name="map-marker-path" size={14} color={tintColor} />
                    <ThemedText type="defaultSemiBold" style={styles.waitingTitle}>Waiting</ThemedText>
                  </View>
                  <ThemedText style={styles.waitingValue}>{latestNews.waiting}</ThemedText>
                </View>
              </ThemedView>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay((index + 1) * 60).duration(360)} style={styles.cardWrap}>
              <ThemedView style={[styles.featuredCard, { borderColor }]}>
                <View style={styles.featuredHeaderRow}>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={16} color={tintColor} />
                    <ThemedText type="defaultSemiBold">{item.date}</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="clock-check-outline" size={16} color={tintColor} />
                </View>

                <View style={styles.pilgrimsRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={24} color={tintColor} />
                  <View>
                    <ThemedText style={[styles.pilgrims, { color: tintColor }]}>{item.pilgrims}</ThemedText>
                    <ThemedText style={styles.pilgrimLabel}>Pilgrims had darshan</ThemedText>
                  </View>
                </View>

                <View style={styles.statsGroup}>
                  <StatRow label="Tonsures" value={item.tonsures} icon="content-cut" tintColor={tintColor} />
                  <StatRow label="Hundi" value={item.hundi} icon="cash-multiple" tintColor={tintColor} />
                  <StatRow label="Darshan" value={item.time} icon="timer-sand" tintColor={tintColor} />
                </View>

                <View style={[styles.waitingBox, { borderColor }]}>
                  <View style={styles.waitingTitleRow}>
                    <MaterialCommunityIcons name="map-marker-path" size={14} color={tintColor} />
                    <ThemedText type="defaultSemiBold" style={styles.waitingTitle}>Waiting</ThemedText>
                  </View>
                  <ThemedText style={styles.waitingValue}>{item.waiting}</ThemedText>
                </View>
              </ThemedView>
            </Animated.View>
          )}
        />
      ) : (activeTab as NewsSubTab) === 'ssd' ? (
        <FlatList
          key="ssd-list"
          data={SSD_TOKEN_INFO}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.infoListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(420)} style={styles.ssdHeaderWrap}>
              <ThemedView style={[styles.ssdHeaderCard, { borderColor }]}> 
                <View style={styles.ssdTitleRow}>
                  <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color={tintColor} />
                  <ThemedText type="defaultSemiBold">Slotted Sarva Darshan</ThemedText>
                </View>

                <View style={styles.ssdMetricsRow}>
                  <View style={[styles.ssdMetricCard, { borderColor }]}>
                    <ThemedText style={styles.ssdMetricLabel}>Running Slot</ThemedText>
                    <ThemedText type="title" style={[styles.ssdMetricValue, { color: tintColor }]}>
                      {SSD_STATUS.runningSlot}
                    </ThemedText>
                    <ThemedText style={styles.ssdMetricSubtext}>on {SSD_STATUS.date}</ThemedText>
                  </View>

                  <View style={[styles.ssdMetricCard, { borderColor }]}>
                    <ThemedText style={styles.ssdMetricLabel}>Balance Tickets</ThemedText>
                    <ThemedText type="title" style={[styles.ssdMetricValue, { color: tintColor }]}>
                      {SSD_STATUS.balanceTickets}
                    </ThemedText>
                    <ThemedText style={styles.ssdMetricSubtext}>for {SSD_STATUS.date}</ThemedText>
                  </View>
                </View>

                <View style={[styles.ssdNoteBox, { borderColor }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={tintColor} />
                  <ThemedText style={styles.ssdNoteText}>
                    Live tickets status may vary by the time pilgrim reaches physically at the counters.
                  </ThemedText>
                </View>
              </ThemedView>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(360)}>
              <ThemedView style={[styles.infoCard, { borderColor }]}> 
                <View style={styles.infoTitleRow}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={tintColor} />
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                </View>
                <ThemedText style={styles.infoDetail}>{item.detail}</ThemedText>
              </ThemedView>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          key={`info-list-${activeTab}`}
          data={DAY_SCHEDULE_INFO}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.infoListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
              <ThemedView style={[styles.infoCard, { borderColor }]}>
                <View style={styles.infoTitleRow}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={tintColor} />
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                </View>
                <ThemedText style={styles.infoDetail}>{item.detail}</ThemedText>
              </ThemedView>
            </Animated.View>
          )}
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
        { borderColor: active ? tintColor : 'transparent', opacity: pressed ? 0.8 : 1 },
      ]}>
      <ThemedText style={[styles.subTabText, active ? { color: tintColor, fontWeight: '700' } : undefined]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function StatRow({
  label,
  value,
  icon,
  tintColor,
}: {
  label: string;
  value: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  tintColor: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <MaterialCommunityIcons name={icon} size={14} color={tintColor} />
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 10, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  banner: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  bannerImage: { width: '100%', height: 120 },
  bannerOverlay: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  bannerText: { fontSize: 13 },
  subTabsWrap: { borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row' },
  subTabButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  subTabText: { fontSize: 12 },
  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 12 },
  column: { gap: 12 },
  cardWrap: { width: '100%' },
  featuredWrap: { marginBottom: 12 },
  featuredCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  featuredHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compactCard: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pilgrimsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pilgrims: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  compactPilgrimsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compactPilgrims: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  pilgrimLabel: { fontSize: 13, lineHeight: 17 },
  compactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactMetaText: { fontSize: 12, lineHeight: 16, marginRight: 6 },
  compactWaitingText: { fontSize: 12, lineHeight: 16 },
  statsGroup: { gap: 4, marginTop: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13, lineHeight: 18 },
  statValue: { fontSize: 13, lineHeight: 18 },
  waitingBox: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 4, marginTop: 4 },
  waitingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waitingTitle: { fontSize: 13 },
  waitingValue: { fontSize: 12, lineHeight: 16 },
  infoListContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24, gap: 12 },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoDetail: { fontSize: 14, lineHeight: 20 },
  ssdHeaderWrap: { marginBottom: 12 },
  ssdHeaderCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  ssdTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ssdMetricsRow: { flexDirection: 'row', gap: 8 },
  ssdMetricCard: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  ssdMetricLabel: { fontSize: 12, lineHeight: 16 },
  ssdMetricValue: { fontSize: 28, lineHeight: 32 },
  ssdMetricSubtext: { fontSize: 11, lineHeight: 15 },
  ssdNoteBox: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  ssdNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
