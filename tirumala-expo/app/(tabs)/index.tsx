import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

// Flat style refs for UpdateSlideCard (defined outside main component to avoid re-creation)
const updateSlideCardStyle: import('react-native').ViewStyle = { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 };
const updateSlideHeaderStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center' };
const updateSlideBadgeStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 };
const updateSlideBadgeTextStyle: import('react-native').TextStyle = { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4 };
const updateSlideTextStyle: import('react-native').TextStyle = { fontSize: 12, lineHeight: 18.5, opacity: 0.88 };
const updateClickHereBtnStyle: import('react-native').ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 };
const updateClickHereTextStyle: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700' };
const updateReadMoreStyle: import('react-native').TextStyle = { fontSize: 11.5, fontWeight: '700', marginTop: 2 };

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
  const overviewServiceItems: OverviewServiceItem[] = overviewServices;

  const accentByTab: Record<HomeTab, string> = {
    overview: tintColor,
    explore: tintColor,
    help: tintColor,
  };
  const activeAccent = accentByTab[activeTab];
  const newsItems: LatestNewsItem[] = latestNews;
  const previewNewsItems = newsItems.slice(0, 4);
  const newsSlideWidth = Math.max(260, screenWidth - 52);
  const updateSlideWidth = newsSlideWidth;

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
                  pagingEnabled
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
            <SsdLiveButton onPress={() => router.push({ pathname: '/(tabs)/news', params: { tab: 'ssd' } })} />
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
          <ThemedText type="defaultSemiBold" style={{ color: activeAccent }}>Help</ThemedText>
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
  overviewQuickLinksWrap: { gap: 10, paddingHorizontal: 2 },
  overviewQuickLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  overviewQuickLinkText: { flex: 1, fontSize: 14, fontWeight: '600' },
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
});
