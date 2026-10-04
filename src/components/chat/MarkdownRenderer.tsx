import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark-dimmed.css";
import { memo } from "react";
import { cn } from "../../lib/utils";

const MarkdownRenderer = memo(({ content }: { content: string }) => {
  return (
    <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-p:leading-relaxed prose-a:text-racing-400 prose-pre:bg-stone-900 prose-pre:border-stone-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;
