import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/config/supabase';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WallpaperItem = {
  id: string;
  title: string;
  url: string;
};

type WallpaperCardProps = {
  item: WallpaperItem;
  index: number;
  isDownloading: boolean;
  isSettingWallpaper: boolean;
  onDownload: (item: WallpaperItem) => Promise<void>;
  onSetWallpaper: (item: WallpaperItem) => Promise<void>;
  borderColor: string;
  tintColor: string;
};

const WallpaperCard = memo(function WallpaperCard({
  item,
  index,
  isDownloading,
  isSettingWallpaper,
  onDownload,
  onSetWallpaper,
  borderColor,
  tintColor,
}: WallpaperCardProps) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(0.96, { damping: 18, stiffness: 260 });
  };
  const handlePressOut = () => {
    pressed.value = withSpring(1, { damping: 18, stiffness: 260 });
  };

  const busy = isDownloading || isSettingWallpaper;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(420)} style={styles.cardWrapper}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => void onSetWallpaper(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={busy}
          style={[styles.card, { borderColor }]}>
          {/* Image fills the card */}
          <Image source={{ uri: item.url }} style={styles.image} contentFit="cover" transition={250} />

          {/* Gradient overlay bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            style={styles.imageOverlay}
          >
            <ThemedText numberOfLines={2} style={styles.overlayTitle}>{item.title}</ThemedText>
            <View style={styles.overlayActions}>
              {/* Download button */}
              <Pressable
                onPress={() => void onDownload(item)}
                disabled={busy}
                style={[styles.overlayBtn, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}>
                <MaterialCommunityIcons
                  name={isDownloading ? 'loading' : 'download-outline'}
                  size={15}
                  color="#fff"
                />
                <ThemedText style={styles.overlayBtnText}>{isDownloading ? 'Saving…' : 'Save'}</ThemedText>
              </Pressable>
              {/* Set wallpaper hint */}
              <View style={styles.overlayHint}>
                <MaterialCommunityIcons name="cellphone" size={11} color="rgba(255,255,255,0.6)" />
                <ThemedText style={styles.overlayHintText}>{isSettingWallpaper ? 'Opening…' : 'Tap to set'}</ThemedText>
              </View>
            </View>
          </LinearGradient>

        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default function WallpapersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [settingWallpaperId, setSettingWallpaperId] = useState<string | null>(null);
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const palette = useMemo(
    () => ({
      borderColor: Colors[colorScheme].icon,
      tintColor: MainTabAccent.wallpapers,
    }),
    [colorScheme]
  );

  const ensureLocalImage = useCallback(async (item: WallpaperItem) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Cache directory unavailable');
    }

    const localPath = `${FileSystem.cacheDirectory}wallpaper-${item.id}.jpg`;
    const result = await FileSystem.downloadAsync(item.url, localPath);
    return result.uri;
  }, []);

  const setAsWallpaper = useCallback(async (item: WallpaperItem) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Set wallpaper is available on Android in this demo.');
      return;
    }

    try {
      setSettingWallpaperId(item.id);

      const localUri = await ensureLocalImage(item);
      const contentUri = await FileSystem.getContentUriAsync(localUri);

      await IntentLauncher.startActivityAsync('android.intent.action.ATTACH_DATA', {
        data: contentUri,
        type: 'image/*',
        flags: 1,
      });
    } catch {
      Alert.alert('Not supported', 'Could not open wallpaper chooser on this device.');
    } finally {
      setSettingWallpaperId(null);
    }
  }, [ensureLocalImage]);

  const loadWallpapers = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('wallpapers')
      .select('id,title,image_url')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setWallpapers([]);
      setLoading(false);
      return;
    }

    const mapped: WallpaperItem[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      url: row.image_url,
    }));

    setWallpapers(mapped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWallpapers();
  }, [loadWallpapers]);

  const downloadWallpaper = useCallback(async (item: WallpaperItem) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Downloading to device gallery is available on Android in this demo.');
      return;
    }

    try {
      setDownloadingId(item.id);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow media access to save wallpapers.');
        return;
      }

      const localUri = await ensureLocalImage(item);

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Saved', `${item.title} was saved to your gallery.`);
    } catch {
      Alert.alert('Download failed', 'Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }, [ensureLocalImage]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<WallpaperItem>) => (
      <WallpaperCard
        item={item}
        index={index}
        isDownloading={downloadingId === item.id}
        isSettingWallpaper={settingWallpaperId === item.id}
        onDownload={downloadWallpaper}
        onSetWallpaper={setAsWallpaper}
        borderColor={palette.borderColor}
        tintColor={palette.tintColor}
      />
    ),
    [
      downloadWallpaper,
      downloadingId,
      palette.borderColor,
      palette.tintColor,
      setAsWallpaper,
      settingWallpaperId,
    ]
  );

  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="image-multiple-outline" size={24} color={palette.tintColor} />
          <ThemedText type="title">Wallpapers</ThemedText>
          {wallpapers.length > 0 && (
            <View style={{ backgroundColor: palette.tintColor + '22', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: palette.tintColor + '50' }}>
              <ThemedText style={{ fontSize: 11, fontWeight: '700', color: palette.tintColor }}>{wallpapers.length}</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={{ fontSize: 12, opacity: 0.55 }}>Tap a wallpaper to set it • Save to gallery</ThemedText>
        {error ? <ThemedText style={styles.errorText}>Unable to load: {error}</ThemedText> : null}
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ThemedText>Loading wallpapers...</ThemedText>
        </View>
      ) : null}

      {!loading && wallpapers.length === 0 ? (
        <View style={styles.stateWrap}>
          <ThemedText>No wallpapers available yet.</ThemedText>
        </View>
      ) : null}

      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => void loadWallpapers()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 5, paddingBottom: 8 },
  listContent: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 28, gap: 10 },
  column: { gap: 10 },
  cardWrapper: { flex: 1 },
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  image: { width: '100%', height: 220 },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingTop: 32, paddingBottom: 10, gap: 6,
  },
  overlayTitle: { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 16 },
  overlayActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  overlayBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  overlayHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  overlayHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  errorText: { fontSize: 12, opacity: 0.75 },
});
