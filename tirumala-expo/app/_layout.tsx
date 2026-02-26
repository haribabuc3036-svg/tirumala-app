import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="ssd-locations" options={{ headerShown: false }} />
        <Stack.Screen name="service/[id]" options={{ title: 'Service Details' }} />
        <Stack.Screen name="places/[regionId]" options={{ title: 'Places' }} />
        <Stack.Screen name="place/[placeId]" options={{ title: 'Place Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
