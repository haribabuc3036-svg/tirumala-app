import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HomeTab = 'overview' | 'explore' | 'support';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = MainTabAccent.index;
  const borderColor = Colors[colorScheme].icon;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<HomeTab>('overview');

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    support: tintColor,
  };
  const activeAccent = accentByTab[activeTab];

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
          <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Welcome</ThemedText>
          <ThemedText style={styles.cardText}>Get daily darshan information, live SSD updates, and pilgrim trends from one place.</ThemedText>
        </ThemedView>
      );
    }

    if (activeTab === 'explore') {
      return (
        <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
          <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Explore</ThemedText>
          <ThemedText style={styles.cardText}>Use Places and Services tabs to plan transport, stay, food, and temple-related facilities.</ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
        <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Support</ThemedText>
        <ThemedText style={styles.cardText}>For SSD token physical counters and today schedules, open Darshan News tab for current status.</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <View style={styles.titleRow}>
          <ThemedText type="title">Home</ThemedText>
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

        <View style={[styles.tabBar, { borderColor }]}> 
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
            label="Support"
            active={activeTab === 'support'}
            onPress={() => setActiveTab('support')}
            tintColor={accentByTab.support}
          />
        </View>

        <Animated.View key={activeTab} entering={FadeInDown.duration(220)}>
          {renderTabContent()}
        </Animated.View>
      </View>
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
  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },
  bannerWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  bannerImage: { width: '100%', height: 200 },
  tabBar: { borderWidth: 1, borderRadius: 12, padding: 4, flexDirection: 'row', marginBottom: 10 },
  tabButton: { flex: 1, borderWidth: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  tabButtonText: { fontSize: 12 },
  contentCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardText: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
});
