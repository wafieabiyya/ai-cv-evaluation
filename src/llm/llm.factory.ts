import type { LLMPort } from "@llm/ports";
import { OpenAILLM } from "@llm/openai/llm";
import { GeminiLLM } from "@llm/gemini/llm";

export function makeLLM(): LLMPort {
  const p = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (p === "openai") return new OpenAILLM();
  if (p === "gemini") return new GeminiLLM();
  // default: gemini
  return new GeminiLLM();
}
