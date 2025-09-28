import OpenAI from "openai";
import type { LLMPort, LLMScoreRaw } from "@llm/ports";
import { buildEvalPrompt } from "@llm/prompts/evaluate";
import { parseEvalJson } from "@llm/json";

export class OpenAILLM implements LLMPort {
  private client: OpenAI;
  private model: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    this.client = new OpenAI({ apiKey: key });

    this.model = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";
  }

  async scoreCandidate(
    input: Parameters<LLMPort["scoreCandidate"]>[0],
  ): Promise<LLMScoreRaw> {
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

    let text = r.choices[0]?.message?.content ?? "";
    if (!text) throw new Error("openai_empty_response");

    text = text.replace(/^```json\s*|\s*```$/g, "").trim();

    return parseEvalJson(text);
  }
}
