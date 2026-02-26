import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
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
  cardColor: string;
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
  cardColor,
  borderColor,
  tintColor,
}: WallpaperCardProps) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressed.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(0.97, { damping: 18, stiffness: 260 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(1, { damping: 18, stiffness: 260 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(450)} style={styles.cardWrapper}>
      <Animated.View style={animatedStyle}>
        <ThemedView style={[styles.card, { borderColor, backgroundColor: cardColor }]}> 
          <Pressable
            onPress={() => void onSetWallpaper(item)}
            disabled={isSettingWallpaper || isDownloading}
            style={styles.imagePressable}>
            <Image source={{ uri: item.url }} style={styles.image} contentFit="cover" transition={250} />
          </Pressable>

          <View style={styles.cardFooter}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {item.title}
            </ThemedText>

            <ThemedText style={styles.tapHint}>
              {isSettingWallpaper ? 'Opening wallpaper chooser...' : 'Tap image to set as wallpaper'}
            </ThemedText>

            <Pressable
              onPress={() => void onDownload(item)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[styles.downloadButton, { borderColor: tintColor }]}
              disabled={isDownloading || isSettingWallpaper}>
              <ThemedText style={[styles.downloadText, { color: tintColor }]}>
                {isDownloading ? 'Downloading...' : 'Download'}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
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
      cardColor: Colors[colorScheme].background,
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
        cardColor={palette.cardColor}
        borderColor={palette.borderColor}
        tintColor={palette.tintColor}
      />
    ),
    [
      downloadWallpaper,
      downloadingId,
      palette.borderColor,
      palette.cardColor,
      palette.tintColor,
      setAsWallpaper,
      settingWallpaperId,
    ]
  );

  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <ThemedText type="title">Wallpapers</ThemedText>
        <ThemedText>Tap Download to save wallpaper to your Android gallery.</ThemedText>
        {error ? <ThemedText style={styles.errorText}>Unable to load wallpapers: {error}</ThemedText> : null}
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  column: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePressable: {
    width: '100%',
  },
  cardFooter: {
    padding: 10,
    gap: 10,
  },
  tapHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  downloadButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  downloadText: {
    fontWeight: '700',
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    opacity: 0.75,
  },
});
