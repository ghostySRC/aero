import { OpenRouterModel, UsageReport } from '../types';

export const calculateInteractionCost = (
  usage: UsageReport | undefined,
  model?: OpenRouterModel
): number => {
  if (!usage) return 0;

  const promptTokens = usage.prompt_tokens || 0;
  // Combine reasoning tokens with completion tokens if separated
  const reasoningTokens = usage.reasoning_tokens || 0;
  const completionTokens = (usage.completion_tokens || 0) + reasoningTokens;

  if (!model || !model.pricing) {
    // Default fallback estimation if pricing info is omitted ($0.002 / 1k approx)
    return (promptTokens * 0.000001) + (completionTokens * 0.000002);
  }

  const rawPromptRate = model.pricing.prompt;
  const rawCompletionRate = model.pricing.completion;

  const promptRateNum = typeof rawPromptRate === 'string' ? parseFloat(rawPromptRate) : (rawPromptRate || 0);
  const completionRateNum = typeof rawCompletionRate === 'string' ? parseFloat(rawCompletionRate) : (rawCompletionRate || 0);

  // In OpenRouter API, pricing values are expressed as cost USD per single token (e.g., 0.00000015)
  // If a model has promptRate 0.00000015, then 1000 prompt tokens = $0.00015.
  const cost = (promptTokens * promptRateNum) + (completionTokens * completionRateNum);

  // Return formatted to 6 decimal places as number
  return Math.max(0, Math.round(cost * 1000000) / 1000000);
};

export const formatUSD = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00';
  if (amount < 0.01 && amount > 0) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
};
