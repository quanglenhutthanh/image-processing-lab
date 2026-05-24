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
    </div>
  );
}
