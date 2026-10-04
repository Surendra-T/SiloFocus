import { Mastra } from "@mastra/core";
import { studyAgent } from "./agents/studyAgent";
import { nudgeAgent } from "./agents/nudgeAgent";

export const mastra = new Mastra({
  agents: { studyAgent, nudgeAgent },
});
