import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMPort, LLMScoreRaw } from "@llm/ports";
import { buildEvalPrompt } from "@llm/prompts/evaluate";
import { parseEvalJson } from "@llm/json";

export class GeminiLLM implements LLMPort {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    this.client = new GoogleGenerativeAI(key);
    this.modelName = process.env.GEMINI_LLM_MODEL || "gemini-2.0-flash";
  }

  async scoreCandidate(
    input: Parameters<LLMPort["scoreCandidate"]>[0],
  ): Promise<LLMScoreRaw> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildEvalPrompt(input);
    const resp = await model.generateContent([{ text: prompt } as any]);

    let raw = "";
    const parts = (resp as any)?.response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts.length > 0) {
      raw = parts
        .map((p: any) => p?.text ?? "")
        .join("")
        .trim();
    }
    if (!raw && typeof (resp as any)?.response?.text === "function") {
      raw = (resp as any).response.text() ?? "";
    }
    if (!raw) throw new Error("gemini_empty_response");

    raw = raw.replace(/^```json\s*|\s*```$/g, "").trim();

    const out = parseEvalJson(raw);
    return out;
  }
}
