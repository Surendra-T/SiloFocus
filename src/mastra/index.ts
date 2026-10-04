import { Mastra } from "@mastra/core";
import { studyAgent } from "./agents/studyAgent";
import { nudgeAgent } from "./agents/nudgeAgent";
import { quizAgent } from "./agents/quizAgent";
import { intelAgent } from "./agents/intelAgent";

export { ollamaModel } from "./model";

export const mastra = new Mastra({
  agents: { studyAgent, nudgeAgent, quizAgent, intelAgent },
});
