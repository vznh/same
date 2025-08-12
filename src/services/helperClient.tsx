// services/helperClient
import axios from "axios";
import { FrameAction, ValidateActionResult, validateFrameAction } from '@/models/frame'

interface OClientI {

  // tools that the agent can use
  // generate a frame
  // delete a frame
  // connect any frames
  // update a frame's content
  // read a frame and talk about it

  // tester
  ping(): Promise<boolean>;
  // parse a natural language command into a structured FrameAction
  parseFrameCommand(text: string): Promise<{ ok: boolean; action?: FrameAction; error?: string }>
  // simple chat helper: returns assistant reply text
  chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<{ ok: boolean; reply?: string }>
}

// perform CRUD with all frames, or generate within them
class OClient implements OClientI {
  private key: string | undefined = process.env.OAI_KEY;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("* Key wasn't given. Check .env.");
    this.key = apiKey;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200 && response.data?.choices?.length > 0;
    } catch (e) {
      console.error("* Ping returned error.\n", e);
      return false;
    }
  }
  
  async parseFrameCommand(text: string): Promise<{ ok: boolean; action?: FrameAction; error?: string }> {
    if (!this.key) return { ok: false, error: 'Missing API key' }
    try {
      const systemPrompt = `You are an assistant that converts a single user instruction into one JSON action that matches this TypeScript union. Output ONLY raw JSON, no prose.

type FrameType = 'text' | 'image' | 'browser' | 'custom'
type FrameAction =
  | { type: 'create'; payload: { title: string; x: number; y: number; width: number; height: number; frameType: FrameType } }
  | { type: 'update'; id: string; updates: Partial<{ title: string; x: number; y: number; width: number; height: number; type: FrameType }> }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'resize'; id: string; width: number; height: number }
  | { type: 'bringToFront'; id: string }
  | { type: 'sendToBack'; id: string }
  | { type: 'select'; id: string; multiSelect?: boolean }
  | { type: 'clearSelection' }
  | { type: 'delete'; id: string }

Rules:
- Only one action per response.
- Numbers must be finite.
- If size or position is missing for create, choose reasonable defaults (x: 200, y: 150, width: 450, height: 350).
- If type is ambiguous, default frameType to 'text'.
- Never include comments or extra keys.`

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const content: string | undefined = response.data?.choices?.[0]?.message?.content
      if (!content) return { ok: false, error: 'No content from model' }

      // Attempt to extract pure JSON
      const jsonString = extractJson(content)
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonString)
      } catch (err) {
        return { ok: false, error: 'Model did not return valid JSON' }
      }

      const validation: ValidateActionResult = validateFrameAction(parsed)
      if (!validation.ok) {
        return { ok: false, error: validation.error }
      }
      return { ok: true, action: validation.action }
    } catch (e) {
      console.error('* parseFrameCommand error', e)
      return { ok: false, error: 'Failed to parse command' }
    }
  }
  
  async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<{ ok: boolean; reply?: string }> {
    if (!this.key) return { ok: false }
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 512,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const reply: string | undefined = response.data?.choices?.[0]?.message?.content
      if (!reply) return { ok: false }
      return { ok: true, reply }
    } catch (e) {
      console.error('* chat error', e)
      return { ok: false }
    }
  }
};

const chatClient = new OClient(
  process.env.OAI_API_KEY || ""
);

export default chatClient;

// Helper to extract JSON between fences or return original content
function extractJson(content: string): string {
  const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/)
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim()
  return content.trim()
}
