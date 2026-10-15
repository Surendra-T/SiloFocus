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

/** Speaks text using native browser speechSynthesis with en-GB fallback. */
export function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === "en-GB" || v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

