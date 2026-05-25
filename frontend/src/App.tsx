import { useEffect, useState } from "react";
import { getHealth, pngDataUrl, processImage } from "./api";
import ChannelView from "./components/ChannelView";
import CodeSnippet from "./components/CodeSnippet";
import Histogram from "./components/Histogram";
import OperationPanel from "./components/OperationPanel";
import PixelMatrix from "./components/PixelMatrix";
import ResultView from "./components/ResultView";
import Uploader from "./components/Uploader";
import type { ImagePayload, ImageStats, ProcessResponse, UploadResponse } from "./types";

function Stats({ stats }: { stats: ImageStats }) {
  const items: [string, number][] = [
    ["min", stats.min],
    ["max", stats.max],
    ["mean", stats.mean],
    ["std", stats.std],
  ];
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {items.map(([label, value]) => (
        <div key={label} className="rounded bg-slate-100 px-2 py-1">
          <div className="text-xs uppercase text-slate-400">{label}</div>
          <div className="font-mono text-sm text-slate-700">{value}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

const toolbarBtn =
  "rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40";

function App() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [original, setOriginal] = useState<UploadResponse | null>(null);
  const [current, setCurrent] = useState<ImagePayload | null>(null);
  const [lastOp, setLastOp] = useState<ProcessResponse | null>(null);
  const [past, setPast] = useState<ImagePayload[]>([]); // for undo (T7.4)
  const [trail, setTrail] = useState<string[]>([]); // applied-operation history
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  function loadImage(img: UploadResponse) {
    setOriginal(img);
    setCurrent(img);
    setLastOp(null);
    setPast([]);
    setTrail([]);
    setError(null);
  }

  async function apply(operation: string, params: Record<string, unknown> = {}) {
    if (!current) return;
    setBusy(true);
    try {
      const res = await processImage({ image_id: current.image_id, operation, params });
      setPast((p) => [...p, current]);
      setTrail((t) => [...t, operation]);
      setCurrent(res);
      setLastOp(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function undo() {
    if (past.length === 0) return;
    setCurrent(past[past.length - 1]);
    setPast(past.slice(0, -1));
    setTrail(trail.slice(0, -1));
    setLastOp(null);
  }

  function reset() {
    if (!original) return;
    setCurrent(original);
    setPast([]);
    setTrail([]);
    setLastOp(null);
  }

  function download() {
    if (!current) return;
    const a = document.createElement("a");
    a.href = pngDataUrl(current.image_base64);
    a.download = `result-${current.image_id.slice(0, 8)}.png`;
    a.click();
  }

  const modified = !!(original && current && current.image_id !== original.image_id);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Image Processing Lab</h1>
        <span className="text-xs text-slate-400">
          backend: {backendOk === null ? "checking…" : backendOk ? "connected" : "unreachable"}
        </span>
      </header>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      {!original || !current ? (
        <Uploader onLoaded={loadImage} onError={setError} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { setOriginal(null); setCurrent(null); }} className={toolbarBtn}>
              ← New image
            </button>
            <button type="button" onClick={undo} disabled={busy || past.length === 0} className={toolbarBtn}>
              Undo
            </button>
            <button type="button" onClick={reset} disabled={busy || !modified} className={toolbarBtn}>
              Reset
            </button>
            <button type="button" onClick={download} className={toolbarBtn}>
              Download
            </button>
            {trail.length > 0 && (
              <span className="font-mono text-xs text-slate-400">{trail.join(" → ")}</span>
            )}
            {original.resized && (
              <span className="text-xs text-amber-600">
                resized from {original.original_width}×{original.original_height}
              </span>
            )}
          </div>

          <Card title="Operations">
            <OperationPanel current={current} busy={busy} onApply={apply} onError={setError} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <ResultView before={original.image_base64} after={current.image_base64} />
              {lastOp && (
                <Card title="OpenCV code">
                  <CodeSnippet
                    operation={lastOp.operation}
                    lecture={lastOp.lecture}
                    opencvFunction={lastOp.opencv_function}
                    code={lastOp.code_snippet}
                  />
                </Card>
              )}
              <Card title="Histogram (before / after)">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Before (original)</p>
                    <Histogram histogram={original.histogram} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-400">After (current)</p>
                    <Histogram histogram={current.histogram} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Stats stats={current.stats} />
              <Card title="Pixel matrix">
                <PixelMatrix
                  imageId={current.image_id}
                  channels={current.channels}
                  beforeId={modified ? original.image_id : undefined}
                />
              </Card>
            </div>
          </div>

          {current.channels === 3 && (
            <Card title="RGB channels (cv2.split)">
              <ChannelView imageId={current.image_id} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
