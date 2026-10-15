/** Gemini provider configuration reading GEMINI_API_KEY. */
export const geminiModel = {
  providerId: "google",
  modelId: "gemini-3.8-flash",
  url: "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY as String,
};
