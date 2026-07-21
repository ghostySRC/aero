import { KeyDetails, OpenRouterModel, ChatMessage, UsageReport } from '../types';

const BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

// 1. Fetch Key Details & Balance
export const fetchKeyDetails = async (apiKey: string): Promise<KeyDetails> => {
  const response = await fetch(`${BASE_URL}/key`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://aero.client',
      'X-Title': 'Aero iOS Sovereign Client',
    },
  });

  if (!response.ok) {
    throw new OpenRouterError(`Failed to fetch key details: ${response.statusText}`, response.status);
  }

  const json = await response.json();
  const data = json.data;

  return {
    label: data?.label || 'Aero Key',
    usage: data?.usage || 0, // Cumulative spend
    limit: data?.limit || null,
    is_free_tier: data?.is_free_tier || false,
    rate_limit: data?.rate_limit || { requests: 0, interval: '10s' },
    limit_remaining: data?.limit_remaining !== undefined ? data.limit_remaining : null, // USD credit balance
  };
};

// 2. Fetch Models Catalog
export const fetchModels = async (apiKey?: string): Promise<OpenRouterModel[]> => {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${BASE_URL}/models`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new OpenRouterError(`Failed to fetch models catalog: ${response.statusText}`, response.status);
  }

  const json = await response.json();
  return json.data || [];
};

// 3. Chat Completions (Text Channel)
export const sendChatCompletion = async (
  apiKey: string,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  onChunk?: (textDelta: string) => void
): Promise<{ text: string; usage?: UsageReport }> => {
  const isStreaming = typeof onChunk === 'function';

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aero.client',
      'X-Title': 'Aero iOS Sovereign Client',
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: isStreaming,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new OpenRouterError(`Chat API error (${response.status}): ${errorText}`, response.status);
  }

  if (isStreaming && response.body) {
    let accumulatedText = '';
    let usage: UsageReport | undefined;

    // Standard reader stream handling or text fallback for RN fetch
    const reader = response.body.getReader ? response.body.getReader() : null;
    if (reader) {
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.substring(6);
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulatedText += delta;
                  onChunk(delta);
                }
                if (parsed.usage) {
                  usage = parsed.usage;
                }
              } catch (e) {
                // Ignore chunk parse errors
              }
            }
          }
        }
      }
    } else {
      // Direct text fallback for React Native fetch response
      const rawText = await response.text();
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.substring(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulatedText += delta;
              onChunk(delta);
            }
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
            // parse error
          }
        }
      }
    }

    return { text: accumulatedText, usage };
  } else {
    const json = await response.json();
    const text = json.choices?.[0]?.message?.content || '';
    const usage = json.usage;
    return { text, usage };
  }
};

// 4. Image Generation (Image Channel)
export const generateImage = async (
  apiKey: string,
  modelId: string,
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<{ url: string; usage?: UsageReport }> => {
  const response = await fetch(`${BASE_URL}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aero.client',
      'X-Title': 'Aero iOS Sovereign Client',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      aspect_ratio: aspectRatio,
      n: 1,
    }),
  });

  if (!response.ok) {
    // Fallback to chat completions with modal image endpoint payload if standard images endpoint varies
    const chatFallbackResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aero.client',
        'X-Title': 'Aero iOS Sovereign Client',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
      }),
    });

    if (!chatFallbackResponse.ok) {
      const errText = await response.text();
      throw new OpenRouterError(`Image generation failed: ${errText}`, response.status);
    }
    const json = await chatFallbackResponse.json();
    const imageUrl = json.choices?.[0]?.message?.images?.[0]?.url || json.choices?.[0]?.message?.content;
    return { url: imageUrl || '', usage: json.usage };
  }

  const json = await response.json();
  const imageUrl = json.data?.[0]?.url || json.url || json.choices?.[0]?.message?.content || '';
  return { url: imageUrl, usage: json.usage };
};

// 5. Video Generation Request (Video Channel)
export const requestVideoGeneration = async (
  apiKey: string,
  modelId: string,
  prompt: string,
  durationSeconds: number = 5,
  aspectRatio: string = '16:9'
): Promise<{ jobId: string }> => {
  const response = await fetch(`${BASE_URL}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aero.client',
      'X-Title': 'Aero iOS Sovereign Client',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      duration: durationSeconds,
      aspect_ratio: aspectRatio,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new OpenRouterError(`Video request error (${response.status}): ${errText}`, response.status);
  }

  const json = await response.json();
  const jobId = json.id || json.job_id || json.data?.id;

  if (!jobId) {
    throw new OpenRouterError('OpenRouter Video API did not return a valid Job ID.');
  }

  return { jobId };
};

// 6. Check Video Job Status
export const checkVideoStatus = async (
  apiKey: string,
  jobId: string
): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; videoUrl?: string; progress?: number; error?: string }> => {
  const response = await fetch(`${BASE_URL}/videos/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://aero.client',
      'X-Title': 'Aero iOS Sovereign Client',
    },
  });

  if (!response.ok) {
    throw new OpenRouterError(`Failed to fetch video job status (${response.status})`, response.status);
  }

  const json = await response.json();
  const status = json.status || (json.completed ? 'completed' : 'processing');
  const videoUrl = json.video_url || json.output?.[0] || json.data?.video_url || json.url;
  const progress = json.progress !== undefined ? json.progress : (status === 'completed' ? 100 : 50);

  return {
    status,
    videoUrl,
    progress,
    error: json.error,
  };
};
