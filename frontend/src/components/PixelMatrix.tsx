import { useEffect, useState, type CSSProperties } from "react";
import { getMatrix } from "../api";
import type { Channel, PixelMatrix as PixelMatrixData } from "../types";

const N_OPTIONS = [5, 8, 10, 12, 16, 20];
const COLOR_CHANNELS: Channel[] = ["gray", "r", "g", "b"];

// Heatmap cell background, tinted per channel so RGB views read clearly.
function cellStyle(channel: Channel, v: number): CSSProperties {
  const rgb =
    channel === "r" ? [v, 0, 0] : channel === "g" ? [0, v, 0] : channel === "b" ? [0, 0, v] : [v, v, v];
  const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return {
    backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    color: lum < 140 ? "#fff" : "#000",
  };
}

function Grid({ matrix }: { matrix: PixelMatrixData }) {
  return (
    <div className="overflow-auto">
      <div
        className="grid gap-px font-mono text-[10px]"
        style={{ gridTemplateColumns: `repeat(${matrix.width}, 26px)` }}
      >
        {matrix.values.flat().map((v, i) => (
          <div key={i} style={cellStyle(matrix.channel, v)} className="flex h-6 items-center justify-center">
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = { imageId: string; channels: number; beforeId?: string };

export default function PixelMatrix({ imageId, channels, beforeId }: Props) {
  const [n, setN] = useState(10);
  const [channel, setChannel] = useState<Channel>("gray");
  const [after, setAfter] = useState<PixelMatrixData | null>(null);
  const [before, setBefore] = useState<PixelMatrixData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channels === 1 && channel !== "gray") setChannel("gray");
  }, [channels, channel]);

  useEffect(() => {
    getMatrix(imageId, { n, channel })
      .then((m) => {
        setAfter(m);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [imageId, n, channel]);

  useEffect(() => {
    if (!beforeId) {
      setBefore(null);
      return;
    }
    getMatrix(beforeId, { n, channel })
      .then(setBefore)
      .catch((e) => setError(String(e)));
  }, [beforeId, n, channel]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          N×N
          <select
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {N_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        {channels === 3 && (
          <div className="flex items-center gap-1 text-sm">
            {COLOR_CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`rounded px-2 py-1 uppercase ${
                  channel === ch ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {before ? (
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-1 text-xs text-slate-400">Before</p>
            <Grid matrix={before} />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">After</p>
            {after && <Grid matrix={after} />}
          </div>
        </div>
      ) : (
        after && (
          <>
            <Grid matrix={after} />
            <p className="text-xs text-slate-400">
              Region ({after.x}, {after.y}) · {after.width}×{after.height} · channel {after.channel}
            </p>
          </>
        )
      )}
    </div>
  );
}
