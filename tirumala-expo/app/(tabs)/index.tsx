import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<HomeTab>('overview');
  const [activeNewsSlide, setActiveNewsSlide] = useState(0);
  const { latestNews, loading: liveLoading } = useLiveUpdates();

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    support: tintColor,
  };
  const activeAccent = accentByTab[activeTab];
  const newsItems: LatestNewsItem[] = latestNews;
  const previewNewsItems = newsItems.slice(0, 4);
  const newsSlideWidth = Math.max(260, screenWidth - 52);

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
                  pagingEnabled
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
                        <View style={styles.newsMetaRow}>
                          <View style={[styles.newsDateDot, { backgroundColor: activeAccent }]} />
                          <ThemedText style={styles.newsDate}>{item.date || 'Latest'}</ThemedText>
                        </View>

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

        <ThemedView style={[styles.contentCard, { borderColor: activeAccent, backgroundColor: activeAccent + '10' }]}> 
          <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Support</ThemedText>
          <ThemedText style={styles.cardText}>For SSD token physical counters and today schedules, open Darshan News tab for current status.</ThemedText>
        </ThemedView>
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
  newsMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newsDateDot: { width: 6, height: 6, borderRadius: 3 },
  newsDate: { fontSize: 11, opacity: 0.65 },
  newsTitle: { fontSize: 12.5, lineHeight: 18 },
  viewDetailsBtn: { alignSelf: 'flex-end', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  viewDetailsText: { fontSize: 11, fontWeight: '700' },
});
