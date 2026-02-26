import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findServiceById } from '@/constants/services-data';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const iconColor = Colors[colorScheme].icon;
  const buttonBackground = colorScheme === 'dark' ? Colors.light.tint : tintColor;
  const buttonTextColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  const service = id ? findServiceById(id) : undefined;

  const onBookNow = async () => {
    if (!service) return;

    const canOpen = await Linking.canOpenURL(service.url);
    if (!canOpen) {
      Alert.alert('Unable to open link', 'Please try again later.');
      return;
    }

    await Linking.openURL(service.url);
  };

  if (!service) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top + 16 }]}> 
        <ThemedText type="title">Service not found</ThemedText>
        <ThemedText style={styles.emptyText}>Please go back and select a valid service.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: service.title }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.image} resizeMode="cover" />

        <View style={styles.titleRow}>
          <View style={[styles.iconBubble, { backgroundColor: `${tintColor}1A` }]}>
            <MaterialCommunityIcons name={service.icon} size={24} color={tintColor} />
          </View>
          <View style={styles.titleCol}>
            <ThemedText type="title" style={styles.titleText}>
              {service.title}
            </ThemedText>
            {service.tag ? (
              <ThemedText style={[styles.tagText, { color: service.tagColor ?? iconColor }]}>
                {service.tag}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <ThemedText style={styles.description}>{service.description}</ThemedText>

        <Pressable style={[styles.bookButton, { backgroundColor: buttonBackground }]} onPress={onBookNow}>
          <ThemedText style={[styles.bookText, { color: buttonTextColor }]}>Book Now</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 22,
    lineHeight: 28,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    opacity: 0.9,
  },
  bookButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
