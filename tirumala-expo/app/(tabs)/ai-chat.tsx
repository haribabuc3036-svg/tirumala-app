import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MainTabAccent } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAiChat, type ChatMessage, type GroundingSource } from '@/hooks/use-ai-chat';

const ACCENT = MainTabAccent.aiChat;

// ─── Message Bubble ───────────────────────────────────────────────────────────

function SourcesRow({ sources }: { sources: GroundingSource[] }) {
  if (!sources.length) return null;
  return (
    <View style={styles.sourcesContainer}>
      <View style={styles.sourcesLabelRow}>
        <MaterialCommunityIcons name="google" size={11} color={ACCENT} />
        <ThemedText style={[styles.sourcesLabel, { color: ACCENT }]}>Search sources</ThemedText>
      </View>
      {sources.map((s, i) => (
        <Pressable key={i} onPress={() => Linking.openURL(s.url)} style={styles.sourceChip}>
          <MaterialCommunityIcons name="link-variant" size={11} color={ACCENT} style={{ marginTop: 1 }} />
          <ThemedText style={[styles.sourceChipText, { color: ACCENT }]} numberOfLines={1}>
            {s.title || s.url}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isUser = message.role === 'user';

  const bubbleStyle = {
    backgroundColor: isUser
      ? ACCENT
      : isDark
        ? '#2A2A2A'
        : '#F0F0F0',
    alignSelf: isUser ? ('flex-end' as const) : ('flex-start' as const),
    borderRadius: 18,
    borderBottomRightRadius: isUser ? 4 : 18,
    borderBottomLeftRadius: isUser ? 18 : 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%' as const,
    marginVertical: 3,
    marginHorizontal: 12,
  };

  const textColor = isUser ? '#fff' : isDark ? '#ECEDEE' : '#11181C';

  return (
    <Animated.View entering={FadeInDown.duration(200)}>
      <View style={bubbleStyle}>
        <ThemedText style={{ color: textColor, fontSize: 15, lineHeight: 22 }}>
          {message.content}
        </ThemedText>
      </View>
      {!isUser && message.sources && message.sources.length > 0 && (
        <SourcesRow sources={message.sources} />
      )}
    </Animated.View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={[
        styles.typingBubble,
        { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' },
      ]}
    >
      <ActivityIndicator size="small" color={ACCENT} />
      <ThemedText style={[styles.typingText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
        SrivariAI is thinking...
      </ThemedText>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AiChatScreen() {
  const { top } = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { messages, isLoading, sendMessage, clearChat } = useAiChat();

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const suggestedQuestions = [
    'How to book SED darshan?',
    'Laddu prasadam price?',
    'Brahmotsavam dates?',
    'Dress code for temple?',
  ];

  const showSuggestions = messages.length === 1; // only welcome message

  return (
    <ThemedView style={[styles.container, { paddingTop: top }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#2A2A2A' : '#E8E8E8' },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: ACCENT + '20' }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={22} color={ACCENT} />
          </View>
          <View>
            <ThemedText style={styles.headerTitle}>SrivariAI</ThemedText>
            <ThemedText style={[styles.headerSub, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Ask anything about Tirumala
            </ThemedText>
          </View>
        </View>
        <Pressable onPress={clearChat} style={styles.clearBtn} hitSlop={8}>
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
        </Pressable>
      </View>

      {/* KeyboardAvoidingView wraps the list + input so everything shifts up together */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />

        {/* Suggestion Chips */}
        {showSuggestions && (
          <View style={styles.suggestionsRow}>
            {suggestedQuestions.map((q) => (
              <Pressable
                key={q}
                onPress={() => {
                  setInputText(q);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ACCENT + '18',
                    borderColor: ACCENT + '40',
                  },
                ]}
              >
                <ThemedText style={[styles.chipText, { color: ACCENT }]}>{q}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputRow,
            {
              borderTopColor: isDark ? '#2A2A2A' : '#E8E8E8',
              backgroundColor: isDark ? '#151718' : '#fff',
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F4F4F4',
                color: isDark ? '#ECEDEE' : '#11181C',
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Tirumala…"
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <Pressable
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  isLoading || !inputText.trim() ? (isDark ? '#2A2A2A' : '#E8E8E8') : ACCENT,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={isLoading || !inputText.trim() ? (isDark ? '#555' : '#aaa') : '#fff'}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  clearBtn: {
    padding: 6,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 3,
    marginHorizontal: 12,
  },
  typingText: {
    fontSize: 14,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcesContainer: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
    maxWidth: '82%',
  },
  sourcesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sourcesLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  sourceChipText: {
    fontSize: 11,
    textDecorationLine: 'underline',
    flex: 1,
  },
});
