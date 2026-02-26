import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLiveUpdates } from '@/hooks/use-live-updates';

type HomeTab = 'overview' | 'explore' | 'support';

type LatestNewsItem = {
  date: string;
  image_url: string;
  link: string;
  title: string;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = MainTabAccent.index;
  const borderColor = Colors[colorScheme].icon;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<HomeTab>('overview');
  const { latestNews, loading: liveLoading } = useLiveUpdates();

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    support: tintColor,
  };
  const activeAccent = accentByTab[activeTab];
  const newsItems: LatestNewsItem[] = latestNews;
  const previewNewsItems = newsItems.slice(0, 3);

  const buildProxyUrl = (sourceUrl: string) => {
    return `https://images.weserv.nl/?url=${encodeURIComponent(sourceUrl)}&w=1200&output=jpg`;
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

          <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
            <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Welcome</ThemedText>
            <ThemedText style={styles.cardText}>Get daily darshan information, live SSD updates, and pilgrim trends from one place.</ThemedText>

          <View style={[styles.latestNewsWrap, { borderColor: activeAccent + '55' }]}> 
            <View style={styles.newsHeaderRow}>
              <ThemedText type="defaultSemiBold" style={[styles.latestNewsTitle, { color: activeAccent }]}>Latest News</ThemedText>
              {!liveLoading && newsItems.length > 3 ? (
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
                {previewNewsItems.map((item, index) => (
                  <View
                    key={`${item.date}-${item.link}`}
                    style={[
                      styles.newsItem,
                      {
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

                {newsItems.length > 3 ? (
                  <Pressable
                    onPress={() => router.push('/latest-news')}
                    style={({ pressed }) => [
                      styles.fullWidthViewMoreBtn,
                      { borderColor: activeAccent, backgroundColor: activeAccent, opacity: pressed ? 0.82 : 1 },
                    ]}>
                    <MaterialCommunityIcons name="newspaper-variant-outline" size={17} color="#fff" />
                    <ThemedText style={styles.fullWidthViewMoreText}>View More News</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" style={{ marginLeft: 'auto' }} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
          </ThemedView>
        </View>
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
          label="Support"
          active={activeTab === 'support'}
          onPress={() => setActiveTab('support')}
          tintColor={accentByTab.support}
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
  tabButton: { flex: 1, borderWidth: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  tabButtonText: { fontSize: 12 },
  contentCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardText: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  latestNewsWrap: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 6, gap: 8 },
  newsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latestNewsTitle: { fontSize: 14 },
  viewMoreBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  viewMoreText: { fontSize: 12, fontWeight: '700' },
  newsListWrap: { gap: 8 },
  newsItem: { width: '100%', borderWidth: 1, borderRadius: 10, padding: 8, gap: 8 },
  newsImage: { width: '100%', height: 165, borderRadius: 8 },
  newsTextWrap: { gap: 8 },
  newsDate: { fontSize: 11, opacity: 0.65 },
  newsTitle: { fontSize: 12, lineHeight: 17 },
  viewDetailsBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  viewDetailsText: { fontSize: 11, fontWeight: '700' },
  fullWidthViewMoreBtn: {
    marginTop: 2,
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullWidthViewMoreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
