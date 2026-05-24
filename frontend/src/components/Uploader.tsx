import { useEffect, useRef, useState } from "react";
import { listSamples, loadSample, pngDataUrl, uploadImage } from "../api";
import type { SampleInfo, UploadResponse } from "../types";

type Props = {
  onLoaded: (img: UploadResponse) => void;
  onError: (message: string) => void;
};

export default function Uploader({ onLoaded, onError }: Props) {
  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSamples()
      .then(setSamples)
      .catch((e) => onError(`Could not load samples: ${e}`));
  }, [onError]);

  async function run<T>(action: () => Promise<T>, map: (r: T) => UploadResponse) {
    setBusy(true);
    try {
      onLoaded(map(await action()));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const handleFile = (file: File) =>
    run(() => uploadImage(file), (r) => r);
  const handleSample = (id: string) =>
    run(() => loadSample(id), (r) => r);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
        }`}
      >
        <p className="font-medium text-slate-700">
          {busy ? "Loading…" : "Drop an image here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-slate-400">PNG, JPG, BMP, TIFF · max 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.bmp,.tif,.tiff"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-500">Or pick a sample</p>
        <div className="grid grid-cols-4 gap-3">
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => handleSample(s.id)}
              className="group rounded-md border border-slate-200 bg-white p-2 text-center hover:border-blue-400 disabled:opacity-50"
            >
              <img
                src={pngDataUrl(s.thumbnail_base64)}
                alt={s.name}
                className="mx-auto h-20 w-20 rounded object-cover"
              />
              <span className="mt-1 block text-xs text-slate-600">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
