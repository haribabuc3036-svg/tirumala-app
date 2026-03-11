import { useState, useCallback } from 'react';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'model';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isOffTopic?: boolean;
  sources?: GroundingSource[];
  grounded?: boolean;
  timestamp: Date;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Jai Govinda! 🙏 I am SrivariAI, your dedicated guide for everything about Tirumala Tirupati Devasthanams and the Sri Venkateswara Temple. Ask me about darshan bookings, sevas, prasadam, accommodations, festivals, or anything related to Tirumala!',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build history from existing messages (exclude the welcome message from history
        // so it doesn't confuse the model)
        const historyPayload = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText.trim(),
            history: historyPayload,
          }),
        });

        const data: {
          success: boolean;
          reply?: string;
          isOffTopic?: boolean;
          sources?: GroundingSource[];
          grounded?: boolean;
          error?: string;
          retryAfterSeconds?: number;
        } = await response.json();

        if (response.status === 503 || (!data.success && data.retryAfterSeconds !== undefined)) {
          const seconds = data.retryAfterSeconds ?? 60;
          const friendlyMsg =
            `⏳ SrivariAI is temporarily unavailable due to high demand. ` +
            `Please try again in about ${seconds} second${seconds !== 1 ? 's' : ''}.`;
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'model' as const,
              content: friendlyMsg,
              isOffTopic: false,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? 'Failed to get a response from SrivariAI.');
        }

        const modelMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.reply ?? '',
          isOffTopic: data.isOffTopic,
          sources: data.sources ?? [],
          grounded: data.grounded ?? false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unexpected error. Please try again.';
        setError(errMsg);

        // Add an error message bubble
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'model',
            content: `⚠️ ${errMsg}`,
            isOffTopic: false,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content:
          'Jai Govinda! 🙏 I am SrivariAI, your dedicated guide for everything about Tirumala Tirupati Devasthanams and the Sri Venkateswara Temple. Ask me about darshan bookings, sevas, prasadam, accommodations, festivals, or anything related to Tirumala!',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
