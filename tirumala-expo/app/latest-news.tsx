import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MainTabAccent } from '@/constants/theme';
import { useLiveUpdates } from '@/hooks/use-live-updates';

type LatestNewsItem = {
  date: string;
  image_url: string;
  link: string;
  title: string;
};

export default function LatestNewsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = MainTabAccent.index;
  const { latestNews, loading } = useLiveUpdates();

  const buildProxyUrl = (sourceUrl: string) => {
    return `https://images.weserv.nl/?url=${encodeURIComponent(sourceUrl)}&w=1200&output=jpg`;
  };

  const items: LatestNewsItem[] = latestNews;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Latest News' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>
        {loading ? <ThemedText style={styles.metaText}>Loading latest news...</ThemedText> : null}
        {!loading && items.length === 0 ? <ThemedText style={styles.metaText}>No latest news available.</ThemedText> : null}

        {items.map((item) => {
          const imageUrl = item.image_url?.trim() ? buildProxyUrl(item.image_url.trim()) : '';

          return (
            <View key={`${item.date}-${item.link}`} style={[styles.newsItem, { borderColor: tintColor + '33', backgroundColor: tintColor + '0A' }]}> 
              <Image
                source={
                  imageUrl
                    ? { uri: imageUrl }
                    : require('../assets/images/banner-image.png')
                }
                style={styles.newsImage}
                contentFit="cover"
                transition={180}
              />

              <View style={styles.newsTextWrap}>
                <ThemedText style={styles.newsTitle}>{item.title}</ThemedText>
                <Pressable
                  onPress={() => void Linking.openURL(item.link)}
                  style={({ pressed }) => [
                    styles.viewDetailsBtn,
                    { borderColor: tintColor, backgroundColor: tintColor + '14', opacity: pressed ? 0.78 : 1 },
                  ]}>
                  <ThemedText style={[styles.viewDetailsText, { color: tintColor }]}>View Details</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },
  metaText: { fontSize: 12, opacity: 0.72 },
  newsItem: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 8 },
  newsImage: { width: '100%', height: 190, borderRadius: 8 },
  newsTextWrap: { gap: 8 },
  newsTitle: { fontSize: 13, lineHeight: 19 },
  viewDetailsBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  viewDetailsText: { fontSize: 12, fontWeight: '700' },
});
