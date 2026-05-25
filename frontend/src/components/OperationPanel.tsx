import { useEffect, useState } from "react";
import { listSamples, loadSample, pngDataUrl, uploadImage } from "../api";
import type { ImagePayload, SampleInfo, UploadResponse } from "../types";

type ScalarOp = "add" | "subtract" | "multiply" | "divide";

const SCALAR: Record<ScalarOp, { label: string; min: number; max: number; step: number; def: number }> = {
  add: { label: "Add", min: 0, max: 255, step: 1, def: 50 },
  subtract: { label: "Subtract", min: 0, max: 255, step: 1, def: 50 },
  multiply: { label: "Multiply", min: 0, max: 3, step: 0.1, def: 1.5 },
  divide: { label: "Divide", min: 1, max: 8, step: 0.1, def: 2 },
};

const TWO_IMAGE: { op: string; label: string }[] = [
  { op: "add_images", label: "Add" },
  { op: "subtract_images", label: "Subtract" },
  { op: "absdiff", label: "AbsDiff" },
  { op: "bitwise_and", label: "AND" },
  { op: "bitwise_or", label: "OR" },
  { op: "bitwise_xor", label: "XOR" },
];

const FILTERS: { op: string; label: string }[] = [
  { op: "mean_filter", label: "Mean" },
  { op: "gaussian_blur", label: "Gaussian" },
  { op: "median_filter", label: "Median" },
  { op: "min_filter", label: "Min" },
  { op: "max_filter", label: "Max" },
  { op: "midpoint_filter", label: "Midpoint" },
];

const SE_SHAPES = [
  { id: "square", label: "Square" },
  { id: "rect", label: "Rect" },
  { id: "ellipse", label: "Ellipse" },
  { id: "cross", label: "Cross" },
];

const MORPH_OPS: { op: string; label: string }[] = [
  { op: "dilate", label: "Dilate" },
  { op: "erode", label: "Erode" },
  { op: "opening", label: "Opening" },
  { op: "closing", label: "Closing" },
];

const EDGE_OPS: { op: string; label: string }[] = [
  { op: "prewitt", label: "Prewitt" },
  { op: "roberts", label: "Roberts" },
  { op: "laplacian", label: "Laplacian" },
  { op: "log", label: "LoG" },
];

type Props = {
  current: ImagePayload;
  busy: boolean;
  onApply: (operation: string, params?: Record<string, unknown>) => void;
  onError: (message: string) => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

const primaryBtn =
  "rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50";

export default function OperationPanel({ current, busy, onApply, onError }: Props) {
  const [scalarOp, setScalarOp] = useState<ScalarOp>("add");
  const [value, setValue] = useState(SCALAR.add.def);
  const [mode, setMode] = useState<"truncate" | "normalize">("truncate");
  const [claheTile, setClaheTile] = useState(8);

  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [second, setSecond] = useState<UploadResponse | null>(null);

  const [noiseSigma, setNoiseSigma] = useState(25);
  const [spAmount, setSpAmount] = useState(0.05);
  const [filterOp, setFilterOp] = useState("mean_filter");
  const [ksize, setKsize] = useState(3);

  const [seShape, setSeShape] = useState("square");
  const [seSize, setSeSize] = useState(3);
  const [threshVal, setThreshVal] = useState(127);
  const [otsu, setOtsu] = useState(false);

  const [sobelDir, setSobelDir] = useState("magnitude");
  const [cannyLow, setCannyLow] = useState(50);
  const [cannyHigh, setCannyHigh] = useState(150);
  const [cannySigma, setCannySigma] = useState(1);

  useEffect(() => {
    listSamples().then(setSamples).catch(() => {});
  }, []);

  const cfg = SCALAR[scalarOp];

  function pickScalar(op: ScalarOp) {
    setScalarOp(op);
    setValue(SCALAR[op].def);
  }

  async function loadSecond(action: () => Promise<UploadResponse>) {
    try {
      setSecond(await action());
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <div className="space-y-3">
      <Section title="Representation (L2)">
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("to_gray")}
          className={`rounded-md px-3 py-1.5 text-sm ${current.channels === 1 ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600"}`}
        >
          Grayscale
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("to_rgb")}
          className={`rounded-md px-3 py-1.5 text-sm ${current.channels === 3 ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600"}`}
        >
          RGB
        </button>
        <button type="button" disabled={busy} onClick={() => onApply("negative")} className={primaryBtn}>
          Negative / NOT
        </button>
      </Section>

      <Section title="Point arithmetic (L5)">
        <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
          {(Object.keys(SCALAR) as ScalarOp[]).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => pickScalar(op)}
              className={`px-3 py-1.5 ${scalarOp === op ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}
            >
              {SCALAR[op].label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <span className="w-12 font-mono">{value}</span>
        </label>
        <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
          {(["truncate", "normalize"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 capitalize ${mode === m ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply(scalarOp, { value, mode })}
          className={primaryBtn}
        >
          Apply
        </button>
      </Section>

      <Section title="Histogram (L6)">
        <button type="button" disabled={busy} onClick={() => onApply("equalize")} className={primaryBtn}>
          Equalize
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("clahe", { tile_size: claheTile })}
          className={primaryBtn}
        >
          CLAHE
        </button>
        <label className="flex items-center gap-1 text-sm text-slate-500">
          tiles
          <select
            value={claheTile}
            onChange={(e) => setClaheTile(Number(e.target.value))}
            className="rounded border border-slate-300 px-1 py-1"
          >
            {[4, 8, 16].map((t) => (
              <option key={t} value={t}>
                {t}×{t}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Two-image (L5)">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">
            Upload 2nd
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.bmp,.tif,.tiff"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadSecond(() => uploadImage(file));
                e.target.value = "";
              }}
            />
          </label>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && loadSecond(() => loadSample(e.target.value))}
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600"
          >
            <option value="">sample…</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {second && (
            <img
              src={pngDataUrl(second.image_base64)}
              alt="second"
              className="h-8 w-8 rounded border border-slate-200 object-cover"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {TWO_IMAGE.map(({ op, label }) => (
            <button
              key={op}
              type="button"
              disabled={busy || !second}
              onClick={() => second && onApply(op, { image_id2: second.image_id })}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Restoration (L7)">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          σ
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={noiseSigma}
            onChange={(e) => setNoiseSigma(Number(e.target.value))}
          />
          <span className="w-8 font-mono">{noiseSigma}</span>
        </label>
        <button type="button" disabled={busy} onClick={() => onApply("gaussian_noise", { sigma: noiseSigma })} className={primaryBtn}>
          Gaussian noise
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          density
          <input
            type="range"
            min={0.01}
            max={0.3}
            step={0.01}
            value={spAmount}
            onChange={(e) => setSpAmount(Number(e.target.value))}
          />
          <span className="w-10 font-mono">{spAmount.toFixed(2)}</span>
        </label>
        <button type="button" disabled={busy} onClick={() => onApply("salt_pepper_noise", { amount: spAmount })} className={primaryBtn}>
          Salt &amp; Pepper
        </button>
      </Section>

      <Section title="Filters (L7)">
        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600"
        >
          {FILTERS.map((f) => (
            <option key={f.op} value={f.op}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          kernel
          <input
            type="range"
            min={3}
            max={15}
            step={2}
            value={ksize}
            onChange={(e) => setKsize(Number(e.target.value))}
          />
          <span className="w-12 font-mono">
            {ksize}×{ksize}
          </span>
        </label>
        <button type="button" disabled={busy} onClick={() => onApply(filterOp, { ksize })} className={primaryBtn}>
          Apply filter
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("wiener_deblur", { psf_size: 5, balance: 0.1 })}
          className={primaryBtn}
        >
          Wiener deblur
        </button>
        <span className="text-xs text-slate-400">(assumed PSF)</span>
      </Section>

      <Section title="Morphology (L8)">
        <select
          value={seShape}
          onChange={(e) => setSeShape(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600"
        >
          {SE_SHAPES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          size
          <input
            type="range"
            min={3}
            max={21}
            step={2}
            value={seSize}
            onChange={(e) => setSeSize(Number(e.target.value))}
          />
          <span className="w-12 font-mono">
            {seSize}×{seSize}
          </span>
        </label>
        <div className="flex flex-wrap gap-1">
          {MORPH_OPS.map(({ op, label }) => (
            <button
              key={op}
              type="button"
              disabled={busy}
              onClick={() => onApply(op, { shape: seShape, ksize: seSize })}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Threshold (L8)">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          t
          <input
            type="range"
            min={0}
            max={255}
            step={1}
            value={threshVal}
            disabled={otsu}
            onChange={(e) => setThreshVal(Number(e.target.value))}
          />
          <span className="w-8 font-mono">{otsu ? "auto" : threshVal}</span>
        </label>
        <button
          type="button"
          onClick={() => setOtsu((v) => !v)}
          className={`rounded-md px-3 py-1.5 text-sm ${otsu ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600"}`}
        >
          Otsu
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("threshold", { thresh: threshVal, otsu })}
          className={primaryBtn}
        >
          Threshold
        </button>
      </Section>

      <Section title="Edges (L9)">
        <select
          value={sobelDir}
          onChange={(e) => setSobelDir(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600"
        >
          <option value="x">Sobel x</option>
          <option value="y">Sobel y</option>
          <option value="magnitude">Sobel magnitude</option>
        </select>
        <button type="button" disabled={busy} onClick={() => onApply("sobel", { direction: sobelDir })} className={primaryBtn}>
          Sobel
        </button>
        <div className="flex flex-wrap gap-1">
          {EDGE_OPS.map(({ op, label }) => (
            <button
              key={op}
              type="button"
              disabled={busy}
              onClick={() => onApply(op)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Canny (L9)">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          low
          <input type="range" min={0} max={255} value={cannyLow} onChange={(e) => setCannyLow(Number(e.target.value))} />
          <span className="w-8 font-mono">{cannyLow}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          high
          <input type="range" min={0} max={255} value={cannyHigh} onChange={(e) => setCannyHigh(Number(e.target.value))} />
          <span className="w-8 font-mono">{cannyHigh}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          σ
          <input type="range" min={0} max={3} step={0.1} value={cannySigma} onChange={(e) => setCannySigma(Number(e.target.value))} />
          <span className="w-8 font-mono">{cannySigma}</span>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply("canny", { low: cannyLow, high: cannyHigh, sigma: cannySigma })}
          className={primaryBtn}
        >
          Canny
        </button>
      </Section>
    </div>
  );
}
