import { useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScheduleItem = {
  id: string;
  title: string;
  detail: string;
};

const DAY_SCHEDULE_INFO: ScheduleItem[] = [
  { id: '1', title: '02:30 - 03:00 hrs • Suprabhatam', detail: 'Start of the temple daily schedule.' },
  { id: '2', title: '03:30 - 04:00 hrs • Thomala Seva', detail: 'Morning seva in the early hours.' },
  { id: '3', title: '04:00 - 04:15 hrs • Koluvu and Panchanga Sravanam', detail: 'Inside Bangaru Vakili (Ekantam).' },
  { id: '4', title: '04:15 - 05:00 hrs • First Archana', detail: 'Sahasranama Archana (Ekantam).' },
  { id: '5', title: '06:00 - 08:00 hrs • Abhishekam & Second Archana', detail: 'SahasraKalasa Abhishekam, Second Archana (Ekantam) and Bell.' },
  { id: '6', title: '09:30 - 19:00 hrs • Darshanam', detail: 'Main darshan window through daytime.' },
  { id: '7', title: '12:00 - 17:00 hrs • Arjitha Sevas', detail: 'Kalyanostavam, Brahmostavam, Vasanthostavam, Unjal Seva.' },
  { id: '8', title: '17:30 - 18:30 hrs • Sahasra Deepalankarana Seva', detail: 'Evening seva period.' },
  { id: '9', title: '19:00 - 20:00 hrs • Suddhi & Night Kainkaryams', detail: 'Ekantam and Night Bell.' },
  { id: '10', title: '20:00 - 00:30 hrs • Darshanam', detail: 'Night darshan window.' },
  { id: '11', title: '00:30 - 00:45 hrs • Suddhi & Preparation', detail: 'Preparations for Ekanta Seva.' },
  { id: '12', title: '00:45 hrs • Ekanta Seva', detail: 'Final seva of the day.' },
];

const TODAY_LABEL = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const carouselRef = useRef<FlatList<ScheduleItem>>(null);
  const currentIndexRef = useRef(0);
  const cardWidth = width - 32;
  const snapSize = cardWidth + 12;

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % DAY_SCHEDULE_INFO.length;
      currentIndexRef.current = nextIndex;
      carouselRef.current?.scrollToOffset({ offset: nextIndex * snapSize, animated: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [snapSize]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <View style={styles.titleRow}>
          <ThemedText type="title">Today Schedules</ThemedText>
        </View>
      </View>

      <View style={styles.listContent}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.bannerWrap}>
          <Image
            source={require('../../assets/images/banner-image.png')}
            style={styles.bannerImage}
            contentFit="cover"
            contentPosition="center"
            transition={200}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 12 }}>
          <ThemedView style={[styles.scheduleDateHeader, { borderColor, backgroundColor: tintColor + '14' }]}>
            <View style={{ gap: 2 }}>
              <ThemedText type="defaultSemiBold" style={[styles.scheduleDateTitle, { color: tintColor }]}>Today's Schedule</ThemedText>
              <ThemedText style={styles.scheduleDateSubtext}>{TODAY_LABEL}</ThemedText>
            </View>
          </ThemedView>
        </Animated.View>

        <FlatList
          ref={carouselRef}
          style={styles.carouselList}
          horizontal
          data={DAY_SCHEDULE_INFO}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={snapSize}
          decelerationRate="fast"
          disableIntervalMomentum
          contentContainerStyle={styles.carouselContent}
          getItemLayout={(_, index) => ({ length: snapSize, offset: snapSize * index, index })}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / snapSize);
            currentIndexRef.current = Math.max(0, Math.min(index, DAY_SCHEDULE_INFO.length - 1));
          }}
          renderItem={({ item, index }) => {
            const parts = item.title.split(' • ');
            const timePart = parts[0].replace(' hrs', '').trim();
            const sevaName = parts[1] ?? '';
            const hour = parseInt(item.title.split(':')[0], 10);
            const periodColor =
              hour >= 2 && hour < 6 ? '#7B68EE' :
              hour >= 6 && hour < 12 ? '#FF8C00' :
              hour >= 12 && hour < 17 ? '#2196F3' :
              hour >= 17 && hour < 20 ? '#FF6B35' : '#3F51B5';

            return (
              <Animated.View entering={FadeInDown.delay(index * 55).duration(360)} style={[styles.carouselItem, { width: cardWidth }]}> 
                <ThemedView style={[styles.scheduleCard, { borderColor, borderLeftColor: periodColor }]}> 
                  <View style={[styles.scheduleTimePill, { backgroundColor: periodColor + '1A' }]}> 
                    <ThemedText style={[styles.scheduleTimeText, { color: periodColor }]}>{timePart}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.scheduleSevaName}>{sevaName}</ThemedText>
                  <ThemedText style={styles.scheduleDetail}>{item.detail}</ThemedText>
                </ThemedView>
              </Animated.View>
            );
          }}
        />
      </View>
    </ThemedView>
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
  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },
  bannerWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  bannerImage: { width: '100%', height: 200 },
  carouselList: { minHeight: 160 },
  carouselContent: { paddingRight: 12 },
  carouselItem: { marginRight: 12 },
  scheduleDateHeader: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  scheduleDateTitle: { fontSize: 15 },
  scheduleDateSubtext: { fontSize: 12, lineHeight: 17, opacity: 0.7 },
  scheduleCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12, gap: 6 },
  scheduleTimePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scheduleTimeText: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
  scheduleSevaName: { fontSize: 14, lineHeight: 20 },
  scheduleDetail: { fontSize: 12, lineHeight: 17, opacity: 0.75 },
});
