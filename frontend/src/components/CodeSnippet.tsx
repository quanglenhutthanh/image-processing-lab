import { useState } from "react";

type Props = {
  operation: string;
  lecture: string;
  opencvFunction: string;
  code: string;
};

// Shows the OpenCV code for the operation just applied, with its lecture label
// and function name (FR-8.2, FR-8.3).
export default function CodeSnippet({ operation, lecture, opencvFunction, code }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-700">{lecture}</span>
          <span className="font-mono text-slate-700">{opencvFunction}</span>
          <span className="text-xs text-slate-400">{operation}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
