import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMPort, LLMScore } from "@llm/ports";
import { buildEvalPrompt } from "@llm/prompts/evaluate";
import { parseEvalJson } from "@llm/json";

export class GeminiLLM implements LLMPort {
  private client: GoogleGenerativeAI;
  private modelName: string;
  constructor() {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.GEMINI_LLM_MODEL || "gemini-1.5-flash";
  }

  async scoreCandidate(
    input: Parameters<LLMPort["scoreCandidate"]>[0],
  ): Promise<LLMScore> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildEvalPrompt(input);
    const resp = await model.generateContent([{ text: prompt } as any]);

    const parts = resp?.response?.candidates?.[0]?.content?.parts;
    let raw = "";
    if (Array.isArray(parts) && parts.length) {
      raw = parts
        .map((p: any) => p?.text ?? "")
        .join("")
        .trim();
    }
    if (!raw) {
      raw = resp?.response?.text?.() ?? "";
    }
    if (!raw) throw new Error("gemini_empty_response");

    // Kadang Gemini ngirim triple backticks, buang dulu
    raw = raw.replace(/^```json\s*|\s*```$/g, "").trim();

    return parseEvalJson(raw);
  }
}
