import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Histogram as HistogramData } from "../types";

// Grayscale → one series; RGB → three overlaid series (FR-4.1, FR-4.2).
function toRows(h: HistogramData) {
  return Array.from({ length: h.bins }, (_, i) => ({
    bin: i,
    gray: h.gray?.[i],
    r: h.r?.[i],
    g: h.g?.[i],
    b: h.b?.[i],
  }));
}

type Props = { histogram: HistogramData; height?: number };

export default function Histogram({ histogram, height = 130 }: Props) {
  const rows = toRows(histogram);
  const isColor = histogram.r != null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
        <XAxis dataKey="bin" ticks={[0, 64, 128, 192, 255]} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={40} />
        <Tooltip
          labelFormatter={(v) => `level ${v}`}
          contentStyle={{ fontSize: 12 }}
          isAnimationActive={false}
        />
        {isColor ? (
          <>
            <Area dataKey="r" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} dot={false} isAnimationActive={false} />
            <Area dataKey="g" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} dot={false} isAnimationActive={false} />
            <Area dataKey="b" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} dot={false} isAnimationActive={false} />
          </>
        ) : (
          <Area dataKey="gray" stroke="#475569" fill="#94a3b8" fillOpacity={0.4} dot={false} isAnimationActive={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
