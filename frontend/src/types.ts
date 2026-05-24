// API contract — mirrors backend/schemas.py 1:1 (T0.4).
// Keep the two files in sync when either changes.

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ImageStats {
  min: number;
  max: number;
  mean: number;
  std: number;
}

export type Channel = "gray" | "r" | "g" | "b";

// 256-bin counts. `gray` set for grayscale; `r`/`g`/`b` for RGB.
export interface Histogram {
  bins: number;
  gray?: number[] | null;
  r?: number[] | null;
  g?: number[] | null;
  b?: number[] | null;
}

// The 0-255 values of a viewed region, top-left origin at (x, y).
export interface PixelMatrix {
  x: number;
  y: number;
  width: number;
  height: number;
  channel: Channel;
  values: number[][];
}

export interface ImagePayload {
  image_id: string;
  image_base64: string; // PNG bytes, base64-encoded (no `data:` prefix)
  width: number;
  height: number;
  channels: number; // 1 = grayscale, 3 = RGB
  stats: ImageStats;
  histogram: Histogram;
  matrix: PixelMatrix;
}

export interface UploadResponse extends ImagePayload {
  resized: boolean; // true if downscaled to a long edge <= 1024px (FR-1.3)
  original_width: number;
  original_height: number;
}

export interface ProcessRequest {
  image_id: string;
  operation: string;
  params: Record<string, unknown>;
}

export interface ProcessResponse extends ImagePayload {
  operation: string;
  lecture: string; // e.g. "L5"
  opencv_function: string; // e.g. "cv2.add"
  code_snippet: string;
}

export interface SampleInfo {
  id: string;
  name: string;
  thumbnail_base64: string;
}

export interface ChannelImage {
  channel: "r" | "g" | "b";
  image_base64: string; // the single channel as a grayscale PNG
  histogram: Histogram;
}

export interface ChannelsResponse {
  channels: ChannelImage[];
}
