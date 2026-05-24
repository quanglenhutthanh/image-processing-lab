import { useEffect, useState } from "react";
import { getChannels, pngDataUrl } from "../api";
import type { ChannelImage } from "../types";
import Histogram from "./Histogram";

const LABEL: Record<string, string> = { r: "Red", g: "Green", b: "Blue" };

export default function ChannelView({ imageId }: { imageId: string }) {
  const [channels, setChannels] = useState<ChannelImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChannels(null);
    getChannels(imageId)
      .then((r) => setChannels(r.channels))
      .catch((e) => setError(String(e)));
  }, [imageId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!channels) return <p className="text-sm text-slate-400">Loading channels…</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {channels.map((c) => (
        <div key={c.channel} className="rounded-md border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-medium text-slate-600">{LABEL[c.channel]} channel</h3>
          <img
            src={pngDataUrl(c.image_base64)}
            alt={`${c.channel} channel`}
            className="mb-2 w-full rounded border border-slate-100"
          />
          <Histogram histogram={c.histogram} height={90} />
        </div>
      ))}
    </div>
  );
}
