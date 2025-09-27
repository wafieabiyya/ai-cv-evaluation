import OpenAI from "openai";
import type { LLMPort, LLMScore } from "@llm/ports";
import { buildEvalPrompt } from "@llm/prompts/evaluate";
import { parseEvalJson } from "@llm/json";

export class OpenAILLM implements LLMPort {
  private client: OpenAI;
  private model: string;
  constructor() {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";
  }
  async scoreCandidate(
    input: Parameters<LLMPort["scoreCandidate"]>[0],
  ): Promise<LLMScore> {
    const prompt = buildEvalPrompt(input);
    const r = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You output only strict JSON exactly matching the requested schema.",
        },
        { role: "user", content: prompt },
      ],
    });
    const text = r.choices[0]?.message?.content ?? "{}";
    return parseEvalJson(text);
  }
}
