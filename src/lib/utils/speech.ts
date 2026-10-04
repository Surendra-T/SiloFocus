/** Converts markdown / LaTeX answers into plain, speakable prose for text-to-speech. */
export function toSpeakableText(markdown: string, maxChars = 2500): string {
  const speakMath = (tex: string): string =>
    ` ${tex
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1 over $2")
      .replace(/\\sqrt\{([^{}]*)\}/g, "square root of $1")
      .replace(/\\(?:cdot|times)/g, " times ")
      .replace(/\\pm/g, " plus or minus ")
      .replace(/\\rightarrow|\\to/g, " goes to ")
      .replace(/\\Delta/g, " delta ")
      .replace(/\\(?:boxed|text|mathrm|vec)\{([^{}]*)\}/g, "$1")
      .replace(/\^\{?2\}?/g, " squared")
      .replace(/\^\{?3\}?/g, " cubed")
      .replace(/\^\{?([^{}\s])\}?/g, " to the power $1")
      .replace(/_\{?([^{}\s])\}?/g, " $1")
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim()} `;

  return markdown
    .replace(/```[\s\S]*?```/g, " code omitted. ")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, tex: string) => speakMath(tex))
    .replace(/\$([^$\n]+)\$/g, (_, tex: string) => speakMath(tex))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#|~]/g, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}
