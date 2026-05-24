import { useEffect, useRef } from "react";
import { pngDataUrl } from "../api";

// Draws a base64 PNG onto a canvas (PRD §5.1 — Canvas API for image display).
function CanvasImage({ base64, label }: { base64: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
    };
    img.src = pngDataUrl(base64);
  }, [base64]);

  return (
    <figure className="flex-1">
      <figcaption className="mb-1 text-sm font-medium text-slate-500">{label}</figcaption>
      <canvas
        ref={ref}
        className="h-auto w-full rounded-md border border-slate-200 bg-[length:16px_16px] [image-rendering:pixelated]"
      />
    </figure>
  );
}

type Props = { before: string; after: string };

export default function ResultView({ before, after }: Props) {
  return (
    <div className="flex gap-4">
      <CanvasImage base64={before} label="Original" />
      <CanvasImage base64={after} label="Result" />
    </div>
  );
}
