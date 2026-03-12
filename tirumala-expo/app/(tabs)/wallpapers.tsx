import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/config/supabase';
import { MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCREEN_W = Dimensions.get('window').width;
const COLS = 3;
const TILE_GAP = 3;
const TILE_W = Math.floor((SCREEN_W - TILE_GAP * (COLS + 1)) / COLS);
const TILE_H = Math.round(TILE_W * 1.6);

type WallpaperItem = { id: string; title: string; url: string };

// ─── Thumbnail tile ───────────────────────────────────────────────────────────
const WallpaperTile = memo(function WallpaperTile({
  item,
  index,
  onPress,
}: {
  item: WallpaperItem;
  index: number;
  onPress: (item: WallpaperItem) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 18, stiffness: 280 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 280 }); }}
        onPress={() => onPress(item)}
        style={styles.tile}
      >
        <Image source={{ uri: item.url }} style={styles.tileImage} contentFit="cover" transition={200} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.60)']} style={styles.tileFade}>
          <ThemedText numberOfLines={2} style={styles.tileTitle}>{item.title}</ThemedText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

// ─── Full-screen viewer modal ─────────────────────────────────────────────────
function WallpaperViewer({
  item,
  visible,
  onClose,
  onShare,
  onSave,
  onSetWallpaper,
  isSetting,
  isSharing,
  isSaving,
  accent,
}: {
  item: WallpaperItem | null;
  visible: boolean;
  onClose: () => void;
  onShare: (item: WallpaperItem) => Promise<void>;
  onSave: (item: WallpaperItem) => Promise<void>;
  onSetWallpaper: (item: WallpaperItem) => Promise<void>;
  isSetting: boolean;
  isSharing: boolean;
  isSaving: boolean;
  accent: string;
}) {
  const insets = useSafeAreaInsets();
  if (!item) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.viewerContainer}>
        <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />

        {/* Top bar */}
        <Animated.View entering={FadeIn.duration(250)} style={[styles.viewerTopBar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </Pressable>
          <ThemedText numberOfLines={1} style={styles.viewerTitle}>{item.title}</ThemedText>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Bottom actions */}
        <Animated.View entering={FadeIn.duration(250)} style={[styles.viewerBottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {/* Row 1: Share + Save */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => void onShare(item)}
              disabled={isSharing || isSetting || isSaving}
              style={({ pressed }) => [styles.actionBtn, { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.15)', opacity: pressed ? 0.7 : 1 }]}
            >
              <MaterialCommunityIcons name={isSharing ? 'loading' : 'share-variant-outline'} size={18} color="#fff" />
              <ThemedText style={styles.actionText}>{isSharing ? 'Sharing…' : 'Share'}</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => void onSave(item)}
              disabled={isSaving || isSetting || isSharing}
              style={({ pressed }) => [styles.actionBtn, { borderColor: 'rgba(255,255,255,0.40)', backgroundColor: 'rgba(255,255,255,0.15)', opacity: pressed ? 0.7 : 1 }]}
            >
              <MaterialCommunityIcons name={isSaving ? 'loading' : 'download-outline'} size={18} color="#fff" />
              <ThemedText style={styles.actionText}>{isSaving ? 'Saving…' : 'Save'}</ThemedText>
            </Pressable>
          </View>

          {/* Row 2: Set Wallpaper — full width */}
          <Pressable
            onPress={() => void onSetWallpaper(item)}
            disabled={isSetting || isSharing || isSaving}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnFull, { backgroundColor: isSetting ? accent + 'aa' : accent, opacity: pressed ? 0.85 : 1, borderColor: 'transparent' }]}
          >
            <MaterialCommunityIcons name={isSetting ? 'loading' : 'cellphone-screenshot'} size={20} color="#fff" />
            <ThemedText style={[styles.actionText, { fontWeight: '800' }]}>{isSetting ? 'Opening…' : 'Set as Wallpaper'}</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WallpapersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const accent = MainTabAccent.wallpapers;
  const insets = useSafeAreaInsets();

  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WallpaperItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadWallpapers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('wallpapers')
      .select('id,title,image_url')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setWallpapers([]); }
    else { setWallpapers((data ?? []).map((r) => ({ id: r.id, title: r.title, url: r.image_url }))); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { void loadWallpapers(); }, [loadWallpapers]);

  const ensureLocalImage = useCallback(async (item: WallpaperItem) => {
    if (!FileSystem.cacheDirectory) throw new Error('Cache unavailable');
    const path = `${FileSystem.cacheDirectory}wallpaper-${item.id}.jpg`;
    const res = await FileSystem.downloadAsync(item.url, path);
    return res.uri;
  }, []);

  const handleShare = useCallback(async (item: WallpaperItem) => {
    try {
      setSharingId(item.id);
      await Share.share({ message: `${item.title}\n${item.url}`, url: item.url, title: item.title });
    } catch { /* dismissed */ } finally { setSharingId(null); }
  }, []);

  const handleSave = useCallback(async (item: WallpaperItem) => {
    try {
      setSavingId(item.id);

      // Android 33+ uses granular media permissions; writeOnly=false gets READ+WRITE
      const permission = await MediaLibrary.requestPermissionsAsync(false);
      if (!permission.granted && permission.accessPrivileges !== 'limited') {
        Alert.alert('Permission needed', 'Please allow media access in Settings to save wallpapers.');
        return;
      }

      const localUri = await ensureLocalImage(item);
      // saveToLibraryAsync needs a file:// URI on Android
      const saveUri = localUri.startsWith('file://') ? localUri : `file://${localUri}`;
      await MediaLibrary.saveToLibraryAsync(saveUri);
      Alert.alert('Saved!', `"${item.title}" was saved to your gallery.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Save failed', msg || 'Please try again.');
    } finally {
      setSavingId(null);
    }
  }, [ensureLocalImage]);

  const handleSetWallpaper = useCallback(async (item: WallpaperItem) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Set wallpaper is supported on Android devices.');
      return;
    }
    try {
      setSettingId(item.id);
      const localUri = await ensureLocalImage(item);
      const contentUri = await FileSystem.getContentUriAsync(localUri);
      await IntentLauncher.startActivityAsync('android.intent.action.ATTACH_DATA', {
        data: contentUri, type: 'image/*', flags: 1,
      });
    } catch { Alert.alert('Not supported', 'Could not open wallpaper chooser on this device.'); }
    finally { setSettingId(null); }
  }, [ensureLocalImage]);

  const openViewer = useCallback((item: WallpaperItem) => {
    setSelected(item);
    setViewerOpen(true);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<WallpaperItem>) => (
      <WallpaperTile item={item} index={index} onPress={openViewer} />
    ),
    [openViewer]
  );

  const pageBg = isDark ? '#111113' : '#F2F2F7';
  const headerBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const border = isDark ? '#2C2C2E' : '#E4E4E7';

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      <LinearGradient
        colors={isDark ? [accent + 'CC', accent + '88', '#111113'] : [accent + 'EE', accent + '99', pageBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        {/* Decorative blobs */}
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: isDark ? '#fff' : '#000', opacity: 0.06, top: -30, right: -20 }} />
        <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: isDark ? '#fff' : '#000', opacity: 0.05, bottom: -10, left: -14 }} />

        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)', borderColor: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.18)' }]}>
            <MaterialCommunityIcons name="image-multiple-outline" size={22} color={isDark ? '#fff' : '#1a1a1a'} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.headerTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>Wallpapers</ThemedText>
            <ThemedText style={[styles.headerSub, { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)' }]}>Tap any wallpaper to preview, share or set it</ThemedText>
          </View>
        </View>
        {error ? <ThemedText style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>Unable to load: {error}</ThemedText> : null}
      </LinearGradient>

      {loading && <View style={styles.stateWrap}><ThemedText style={{ opacity: 0.5 }}>Loading wallpapers…</ThemedText></View>}
      {!loading && wallpapers.length === 0 && (
        <View style={styles.stateWrap}>
          <MaterialCommunityIcons name="image-off-outline" size={42} color={accent + '80'} />
          <ThemedText style={{ opacity: 0.5, marginTop: 10 }}>No wallpapers available yet.</ThemedText>
        </View>
      )}

      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={COLS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => void loadWallpapers()}
      />

      <WallpaperViewer
        item={selected}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onShare={handleShare}
        onSave={handleSave}
        onSetWallpaper={handleSetWallpaper}
        isSetting={!!(selected && settingId === selected.id)}
        isSharing={!!(selected && sharingId === selected.id)}
        isSaving={!!(selected && savingId === selected.id)}
        accent={accent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 18, overflow: 'hidden', gap: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  badge: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  badgeText: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 22 },
  badgeLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.70)', letterSpacing: 0.8 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  errorText: { fontSize: 12, color: '#FCA5A5', marginTop: 6 },
  listContent: { padding: TILE_GAP },
  row: { gap: TILE_GAP, marginBottom: TILE_GAP },
  tile: { width: TILE_W, height: TILE_H, borderRadius: 4, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  tileImage: { width: '100%', height: '100%' },
  tileFade: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 22, paddingBottom: 5, paddingHorizontal: 5 },
  tileTitle: { color: '#fff', fontSize: 9, fontWeight: '600', lineHeight: 12, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  // viewer
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.45)', gap: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  viewerTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  viewerBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, gap: 10, paddingHorizontal: 20, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 16, borderWidth: 1 },
  actionBtnFull: { flex: 0, alignSelf: 'stretch' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
