import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../config/env';

// ─── Tirumala-only System Instruction ────────────────────────────────────────
const SYSTEM_INSTRUCTION = `
You are SrivariAI, a dedicated virtual assistant for Tirumala Tirupati Devasthanams (TTD) and the
Tirumala Venkateswara Temple. You have deep knowledge about:

- Sri Venkateswara (Balaji) temple history, significance, and legends
- Darshan types and their timings (Sarva Darshan, Special Entry Darshan, VIP/SED, Divya Darshan etc.)
- Online and offline ticket booking procedures (TTD's e-seva portal, SED tokens, NRI darshan)
- Accommodation (TTD guest houses, choultries, cottages – how to book, rates, rules)
- Sevas and Arjitam sevas (Suprabhatam, Archana, Kalyanotsavam, Brahmotsavam, etc.)
- Prasadam (Laddu, Vada, Pulihora – distribution rules, prices, how to get them)
- Hundi donations and online donations to TTD
- Dress code, items allowed/prohibited inside the temple
- Important festivals: Brahmotsavam, Vaikunta Ekadasi, Rathasapthami, etc.
- Pilgrimage traveller information: how to reach Tirumala by bus, car (ghat road rules), helicopter
- Sacred ponds: Swami Pushkarini, Akasha Ganga, Papavinasanam Dam
- TTD-managed temples and shrines in Tirumala/Tirupati
- Nearby holy places: Srinivasa Mangapuram, Govindarajaswamy temple, ISKCON Tirupati, etc.
- Rules and etiquette for visiting the temple complex

You have access to Google Search. Use it proactively for:
- Real-time darshan waiting times or token availability
- Current TTD quota / SED ticket release dates
- Upcoming festival schedules and Brahmotsavam vahana seva timings
- Live news and announcements from TTD
- Any time-sensitive Tirumala information that may have changed recently

STRICT RULES:
1. Only answer questions related to Tirumala, Tirupati, TTD, Sri Venkateswara temple, or those
   directly connected pilgrimages/religious topics above.
2. If a question is completely unrelated to the above topics, politely decline and say:
   "I'm SrivariAI and I can only assist with questions related to Tirumala Tirupati Devasthanams
   and the Sri Venkateswara temple. Please ask me something about Tirumala!"
3. Do NOT answer questions about other religions, politics, generic technology, entertainment,
   sports, finance, or any other unrelated topic.
4. Keep answers helpful, concise, respectful, and devotional in tone.
5. When you use Google Search results, naturally incorporate the information — do NOT just list URLs.
`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AiChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface AiChatResponse {
  reply: string;
  isOffTopic: boolean;
  /** Web sources used by Google Search grounding (empty if grounding was not triggered) */
  sources: GroundingSource[];
  /** Whether the reply was grounded with live Google Search results */
  grounded: boolean;
}

/** Thrown when the Gemini API returns 429 Too Many Requests */
export class QuotaExceededError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super('Gemini quota exceeded');
    this.name = 'QuotaExceededError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// ─── Gemini Client ────────────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return genAI;
}

/**
 * Free-tier models tried in order.
 * Each has its own independent daily/minute quota so falling back to the next
 * one gives a real second chance when the first is exhausted.
 *
 * Free-tier limits (as of 2026, confirmed via ListModels):
 *   gemini-2.0-flash-lite  – 30 RPM / 1 500 RPD  (primary, lightest)
 *   gemini-2.0-flash       – 15 RPM / 1 500 RPD  (fallback)
 *   gemini-2.5-flash-lite  – 15 RPM / 500  RPD   (last resort)
 */
const FREE_TIER_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
] as const;

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/** Returns true if the error is a 429 / quota error */
function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.toLowerCase().includes('quota');
}

/** Extract the recommended retry delay from the Gemini error body (default 60 s) */
function parseRetryDelay(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/retryDelay[":\s]+([0-9]+)/);
  return match ? parseInt(match[1], 10) : 60;
}

// ─── Service Function ─────────────────────────────────────────────────────────

/**
 * Send a message to Gemini with conversation history and return the assistant reply.
 * Tries each FREE_TIER_MODELS entry in sequence; only throws QuotaExceededError
 * after all models have been exhausted.
 */
export async function askSrivariAI(request: AiChatRequest): Promise<AiChatResponse> {
  const { message, history = [] } = request;

  // Convert stored history to Gemini's Content[] format (shared across attempts)
  const geminiHistory = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  let lastRetryDelay = 60;

  for (const modelName of FREE_TIER_MODELS) {
    // ── Attempt 1: with Google Search grounding ──────────────────────────────
    for (const useGrounding of [true, false]) {
      try {
        console.log(`[SrivariAI] model=${modelName} grounding=${useGrounding}`);

        const modelConfig = {
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          safetySettings: SAFETY_SETTINGS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(useGrounding ? { tools: [{ googleSearch: {} } as any] } : {}),
        };

        const model = getGenAI().getGenerativeModel(modelConfig);
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        // Extract grounding sources from the response metadata
        const chunks =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result.response as any).candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const sources: GroundingSource[] = chunks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((c: any) => c?.web?.uri)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({ title: c.web.title ?? c.web.uri, url: c.web.uri }));

        const offTopicMarker = "I'm SrivariAI and I can only assist with questions related to Tirumala";
        const isOffTopic = reply.includes(offTopicMarker);

        console.log(`[SrivariAI] Success — model=${modelName} grounded=${sources.length > 0}`);
        return { reply, isOffTopic, sources, grounded: sources.length > 0 };
      } catch (err: unknown) {
        if (isQuotaError(err)) {
          lastRetryDelay = parseRetryDelay(err);
          console.warn(`[SrivariAI] Quota exceeded for ${modelName} (grounding=${useGrounding}), retryAfter=${lastRetryDelay}s`);
          break; // quota hit — skip the no-grounding retry, move to next model
        }
        if (useGrounding) {
          // Grounding not supported on this model/tier — retry without it
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[SrivariAI] Grounding unavailable for ${modelName}: ${msg.slice(0, 120)} — retrying without grounding`);
          continue;
        }
        throw err; // non-quota, non-grounding error — bubble up
      }
    }
  }

  // All models exhausted
  throw new QuotaExceededError(lastRetryDelay);
}
