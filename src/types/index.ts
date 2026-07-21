export type Modality = 'text' | 'image' | 'video';

export interface OpenRouterModel {
  id: string;
  name: string;
  created?: number;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
    image?: string | number;
    request?: string | number;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
}

export interface KeyDetails {
  label: string;
  usage: number; // total cumulative spend in USD
  limit: number | null;
  is_free_tier: boolean;
  rate_limit: {
    requests: number;
    interval: string;
  };
  limit_remaining: number | null; // active USD credit balance
}

export interface UsageReport {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  reasoning_tokens?: number;
}

export interface CostLedgerEntry {
  id: string;
  timestamp: number;
  modelId: string;
  modality: Modality;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  costUSD: number;
  promptSnippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
  costUSD?: number;
  isStreaming?: boolean;
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: number;
  costUSD?: number;
}

export interface VideoJob {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  videoUrl?: string;
  error?: string;
  timestamp: number;
  durationSeconds?: number;
  aspectRatio?: string;
  costUSD?: number;
}
