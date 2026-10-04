"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark-dimmed.css";

function MarkdownRendererBase({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-silo max-w-none prose-headings:mb-2 prose-headings:mt-5 prose-headings:font-serif prose-headings:font-medium prose-p:leading-relaxed prose-pre:rounded-xl prose-pre:border prose-pre:border-edge/60 prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

const MarkdownRenderer = memo(MarkdownRendererBase);
export default MarkdownRenderer;
