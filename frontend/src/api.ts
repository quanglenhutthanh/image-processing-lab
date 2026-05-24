import axios from "axios";
import type {
  Channel,
  ChannelsResponse,
  HealthResponse,
  PixelMatrix,
  ProcessRequest,
  ProcessResponse,
  SampleInfo,
  UploadResponse,
} from "./types";

const baseURL = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export const api = axios.create({ baseURL });

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload", form);
  return data;
}

export async function listSamples(): Promise<SampleInfo[]> {
  const { data } = await api.get<SampleInfo[]>("/samples");
  return data;
}

export async function loadSample(id: string): Promise<UploadResponse> {
  const { data } = await api.post<UploadResponse>(`/samples/${id}`);
  return data;
}

export async function processImage(req: ProcessRequest): Promise<ProcessResponse> {
  const { data } = await api.post<ProcessResponse>("/process", req);
  return data;
}

export async function getMatrix(
  imageId: string,
  params: { x?: number; y?: number; n?: number; channel?: Channel },
): Promise<PixelMatrix> {
  const { data } = await api.get<PixelMatrix>(`/matrix/${imageId}`, { params });
  return data;
}

export async function getChannels(imageId: string): Promise<ChannelsResponse> {
  const { data } = await api.get<ChannelsResponse>(`/channels/${imageId}`);
  return data;
}

// Build a data URL from the raw base64 PNG the backend returns.
export function pngDataUrl(base64: string): string {
  return `data:image/png;base64,${base64}`;
}
