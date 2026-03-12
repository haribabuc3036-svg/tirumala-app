import { Tabs } from 'expo-router';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MainTabAccent } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarActiveTintColor: MainTabAccent.index,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="temple-hindu" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Darshan',
          tabBarActiveTintColor: MainTabAccent.news,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="newspaper.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarActiveTintColor: MainTabAccent.services,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="hand-heart-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallpapers"
        options={{
          title: 'Wallpapers',
          tabBarActiveTintColor: MainTabAccent.wallpapers,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="photo.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: 'Places',
          tabBarActiveTintColor: MainTabAccent.places,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'SrivariAI',
          tabBarActiveTintColor: MainTabAccent.aiChat,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="robot-happy-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
