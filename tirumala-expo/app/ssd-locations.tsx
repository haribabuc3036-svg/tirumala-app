import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Location = {
  id: string;
  name: string;
  area: string;
  timings: string;
  icon: 'map-marker-outline' | 'office-building-marker-outline' | 'home-city-outline' | 'store-marker-outline' | 'bank-outline' | 'hospital-building';
  note?: string;
};

const SSD_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Vishnu Nivasam Counter',
    area: 'Tirumala, Near Bus Stand',
    timings: '06:00 AM – 06:00 PM',
    icon: 'office-building-marker-outline',
    note: 'Main distribution point. Highest daily quota.',
  },
  {
    id: '2',
    name: 'Padmavathi Guest House Counter',
    area: 'Tirumala, West Mada Street',
    timings: '06:00 AM – 06:00 PM',
    icon: 'home-city-outline',
  },
  {
    id: '3',
    name: 'Srinivasam Complex Counter',
    area: 'Tirumala, Near Alipiri Check-post',
    timings: '06:00 AM – 05:00 PM',
    icon: 'office-building-marker-outline',
  },
  {
    id: '4',
    name: 'Kalyanakattu Counter',
    area: 'Tirumala, Near Mahadwaram',
    timings: '05:30 AM – 06:00 PM',
    icon: 'store-marker-outline',
    note: 'Opens early. Limited tokens available.',
  },
  {
    id: '5',
    name: 'Central Reception Office (CRO)',
    area: 'Tirupati, Near Railway Station',
    timings: '07:00 AM – 07:00 PM',
    icon: 'bank-outline',
    note: 'Pre-booking for pilgrims arriving by train.',
  },
  {
    id: '6',
    name: 'Alipiri Foot-path Pilgrim Facilitation',
    area: 'Alipiri, Tirupati',
    timings: '05:00 AM – 04:00 PM',
    icon: 'map-marker-outline',
    note: 'Issued to pilgrims climbing on foot only.',
  },
];

export default function SsdLocationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon;
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={tintColor} />
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedText type="title" style={styles.title}>SSD Token Counters</ThemedText>
          <ThemedText style={styles.subtitle}>Physical counter locations for free tickets</ThemedText>
        </View>
      </View>

      {/* Info banner */}
      <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={[styles.infoBanner, { borderColor: tintColor + '44', backgroundColor: tintColor + '12' }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={tintColor} />
          <ThemedText style={[styles.infoBannerText, { color: tintColor }]}>
            SSD Tokens are <ThemedText style={[styles.bold, { color: tintColor }]}>free of cost</ThemedText>. Issued on first-come-first-serve basis at counters below.
          </ThemedText>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {SSD_LOCATIONS.map((loc, index) => (
          <Animated.View key={loc.id} entering={FadeInDown.delay(index * 70).duration(380)}>
            <ThemedView style={[styles.locationCard, { borderColor, borderLeftColor: tintColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: tintColor + '1E' }]}>
                <MaterialCommunityIcons name={loc.icon} size={22} color={tintColor} />
              </View>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.locationName}>{loc.name}</ThemedText>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={tintColor} />
                  <ThemedText style={styles.metaText}>{loc.area}</ThemedText>
                </View>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={tintColor} />
                  <ThemedText style={styles.metaText}>{loc.timings}</ThemedText>
                </View>
                {loc.note && (
                  <View style={[styles.noteRow, { backgroundColor: tintColor + '12', borderColor: tintColor + '30' }]}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={12} color={tintColor} />
                    <ThemedText style={[styles.noteText, { color: tintColor }]}>{loc.note}</ThemedText>
                  </View>
                )}
              </View>
            </ThemedView>
          </Animated.View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { marginTop: 4, padding: 2 },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontSize: 22 },
  subtitle: { fontSize: 13, lineHeight: 18, opacity: 0.7 },
  infoBanner: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoBannerText: { flex: 1, fontSize: 13, lineHeight: 19 },
  bold: { fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 12 },
  locationCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, gap: 5 },
  locationName: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, lineHeight: 17, opacity: 0.8 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginTop: 2 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
