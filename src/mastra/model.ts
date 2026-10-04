/** OpenAI-compatible model config pointing at the local Ollama instance. */
export const ollamaModel = {
  providerId: "ollama",
  modelId: process.env.OLLAMA_MODEL || "gemma2:9b",
  url: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: "ollama",
};
