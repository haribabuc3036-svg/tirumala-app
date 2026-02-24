import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WallpapersScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Wallpapers</ThemedText>
      <ThemedText>Wallpapers will be listed here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
});
