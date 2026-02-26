import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useServicesCatalog } from '@/hooks/use-services-catalog';

export default function ServicesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const tintColor = Colors[colorScheme].tint;
  const itemWidth = '31.5%';
  const { categories, error } = useServicesCatalog();

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 14 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Services</ThemedText>
            <ThemedText style={styles.subtitle}>
              Tap any service to view details and book.
            </ThemedText>
            {error ? <ThemedText style={styles.fallbackNote}>Unable to load services: {error}</ThemedText> : null}
          </View>
        }
        renderItem={({ item: category }) => (
          (() => {
            const sectionAccent = tintColor;

            return (
          <View
            style={[
              styles.sectionWrap,
              {
                borderColor: `${sectionAccent}30`,
                backgroundColor: `${sectionAccent}0D`,
              },
            ]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionHeaderIcon, { backgroundColor: `${sectionAccent}20` }]}>
                <MaterialCommunityIcons name={category.icon} size={14} color={sectionAccent} />
              </View>
              <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: sectionAccent }]}> 
                {category.heading}
              </ThemedText>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: `${sectionAccent}2A` }]} />

            <View style={styles.sectionGrid}>
              {category.services.map((service, svcIndex) => {
                const isLastInRow = (svcIndex + 1) % 3 === 0;

                return (
                <Pressable
                  key={service.id}
                  style={({ pressed }) => [
                    styles.itemWrap,
                    {
                      width: itemWidth,
                      marginRight: isLastInRow ? 0 : '2%',
                      opacity: pressed ? 0.78 : 1,
                      borderColor: `${sectionAccent}26`,
                      backgroundColor: `${sectionAccent}14`,
                    },
                  ]}
                  onPress={() =>
                    router.push({ pathname: '/service/[id]', params: { id: service.id } })
                  }>
                  <View style={[styles.iconCircle, { backgroundColor: `${sectionAccent}20` }]}>
                    <MaterialCommunityIcons name={service.icon} size={16} color={sectionAccent} />
                  </View>
                  <ThemedText style={styles.title} numberOfLines={2}>
                    {service.title}
                  </ThemedText>
                  {service.tag ? (
                    <View style={[styles.tagPill, { backgroundColor: `${service.tagColor ?? sectionAccent}1E` }]}>
                      <ThemedText style={[styles.category, { color: service.tagColor ?? sectionAccent }]} numberOfLines={1}>
                        {service.tag}
                      </ThemedText>
                    </View>
                  ) : null}
                </Pressable>
                );
              })}
            </View>
          </View>
            );
          })()
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 4,
    marginBottom: 14,
    gap: 4,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.72,
  },
  fallbackNote: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  sectionHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15.5,
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  itemWrap: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
    minHeight: 24,
  },
  category: {
    fontSize: 8.5,
    opacity: 0.92,
    fontWeight: '700',
  },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
