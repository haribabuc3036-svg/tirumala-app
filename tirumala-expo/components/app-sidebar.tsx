import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCREEN_W = Dimensions.get('window').width;
const SIDEBAR_W = Math.min(SCREEN_W * 0.78, 320);

type SubItem = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: string;
};

type NavItem = {
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accent: string;
  route: string;
  subItems?: SubItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    subtitle: 'Overview, News & Help',
    icon: 'home-variant-outline',
    accent: MainTabAccent.index,
    route: '/(tabs)/',
    subItems: [
      { label: 'Overview',  icon: 'view-dashboard-outline',    route: '/(tabs)/?tab=overview' },
      { label: 'News',      icon: 'newspaper-variant-outline', route: '/(tabs)/?tab=news' },
      { label: 'Help',      icon: 'help-circle-outline',       route: '/(tabs)/?tab=help' },
    ],
  },
  {
    label: 'Darshan',
    subtitle: 'Pilgrim updates & schedules',
    icon: 'temple-hindu',
    accent: MainTabAccent.news,
    route: '/(tabs)/news',
    subItems: [
      { label: 'Pilgrim Updates', icon: 'account-group-outline',     route: '/(tabs)/news?tab=pilgrims' },
      { label: 'Day Schedules',   icon: 'calendar-clock-outline',    route: '/(tabs)/news?tab=schedule' },
      { label: 'Free Tickets',    icon: 'ticket-confirmation-outline', route: '/(tabs)/news?tab=ssd' },
    ],
  },
  { label: 'Services',   subtitle: 'Book sevas & accommodations',   icon: 'hand-heart-outline',      accent: MainTabAccent.services,   route: '/(tabs)/services' },
  { label: 'Wallpapers', subtitle: 'Download & set TTD wallpapers', icon: 'image-multiple-outline',  accent: MainTabAccent.wallpapers, route: '/(tabs)/wallpapers' },
  { label: 'Places',     subtitle: 'Temples & pilgrim destinations', icon: 'map-marker-star-outline', accent: MainTabAccent.places,    route: '/(tabs)/places' },
  { label: 'SrivariAI',  subtitle: 'AI assistant for TTD queries',  icon: 'robot-happy-outline',     accent: MainTabAccent.aiChat,    route: '/(tabs)/ai-chat' },
];

const QUICK_LINKS = [
  { label: 'Upcoming Bookings', icon: 'clock-fast' as const,                            route: '/upcoming-bookings' },
  { label: 'Latest News',       icon: 'newspaper-variant-multiple-outline' as const,    route: '/latest-news' },
  { label: 'SSD Locations',     icon: 'map-marker-radius' as const,                    route: '/ssd-locations' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AppSidebar({ visible, onClose }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_W, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setExpandedItem(null);
    }
  }, [visible]);

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 250);
  };

  const toggleExpand = (label: string) => {
    setExpandedItem((prev) => (prev === label ? null : label));
  };

  const bgColor = isDark ? '#0f0f14' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.55)', opacity: backdropAnim },
          ]}
        />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: SIDEBAR_W,
            backgroundColor: bgColor,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#0A7EA4CC', '#0A7EA455', 'transparent'] : ['#0A7EA4EE', '#0A7EA488', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerHeader}
        >
          <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#000', opacity: 0.05, top: -24, right: -20 }} />
          <View style={styles.drawerHeaderRow}>
            <View style={styles.drawerLogoWrap}>
              <MaterialCommunityIcons name="temple-hindu" size={26} color="#000" />
            </View>
            <View style={styles.drawerAppTextWrap}>
              <ThemedText style={styles.drawerAppName}>TTD Tirumala</ThemedText>
              <ThemedText style={styles.drawerAppSub}>Tirumala Tirupati Devasthanams</ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="close" size={20} color="rgba(0,0,0,0.70)" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 0 }}>
          {/* Nav items */}
          <View style={[styles.section, { borderColor }]}>
            <ThemedText style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>NAVIGATION</ThemedText>
            {NAV_ITEMS.map((item) => {
              const hasSubItems = !!item.subItems?.length;
              const isExpanded = expandedItem === item.label;
              return (
                <View key={item.route}>
                  <Pressable
                    onPress={() => hasSubItems ? toggleExpand(item.label) : navigate(item.route)}
                    style={({ pressed }) => [
                      styles.navItem,
                      { borderColor, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={[styles.navIconWrap, { backgroundColor: item.accent + '20' }]}>
                      <MaterialCommunityIcons name={item.icon} size={20} color={item.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.navLabel}>{item.label}</ThemedText>
                      <ThemedText style={[styles.navSubtitle, { color: subtitleColor }]}>{item.subtitle}</ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={hasSubItems ? (isExpanded ? 'chevron-down' : 'chevron-right') : 'chevron-right'}
                      size={16}
                      color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                    />
                  </Pressable>

                  {/* Sub-items dropdown */}
                  {hasSubItems && isExpanded && (
                    <View style={[styles.subItemsWrap, { borderColor }]}>
                      {item.subItems!.map((sub) => (
                        <Pressable
                          key={sub.label}
                          onPress={() => navigate(sub.route)}
                          style={({ pressed }) => [
                            styles.subItem,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : item.accent + '0D', opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <View style={[styles.subItemDot, { backgroundColor: item.accent }]} />
                          <MaterialCommunityIcons name={sub.icon} size={15} color={item.accent} />
                          <ThemedText style={[styles.subItemLabel, { color: isDark ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.75)' }]}>{sub.label}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Quick links */}
          <View style={[styles.section, { borderColor }]}>
            <ThemedText style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>QUICK LINKS</ThemedText>
            {QUICK_LINKS.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [
                  styles.quickItem,
                  { borderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={16} color={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'} />
                <ThemedText style={[styles.quickLabel, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }]}>{item.label}</ThemedText>
                <MaterialCommunityIcons name="arrow-right" size={14} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerLogoWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  drawerAppTextWrap: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
  },
  drawerAppName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.2,
  },
  drawerAppSub: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.60)',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  navSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },
  subItemsWrap: {
    marginTop: 3,
    marginBottom: 3,
    marginLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0,0,0,0.08)',
    paddingLeft: 10,
    gap: 2,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  subItemDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  subItemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
