/**
 * File uploads go to Supabase Storage (bucket "uploads"), so logos, menu photos,
 * brochures and videos open from any device. Images are scaled down before upload.
 */
import { uploadToStorage } from "./db";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export class UploadError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UploadError("Gambar tidak bisa dibuka."));
    };
    el.src = url;
  });
}

/** Scale an image so its longer side is at most `maxSide`, as a JPEG blob. */
async function shrinkImage(file: File, maxSide: number): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return blob || file;
}

/** Upload an image (logo, menu photo, banner) and return its public link. */
export async function uploadImage(userId: string, file: File, folder: string, maxSide = 1200): Promise<string> {
  if (!userId) throw new UploadError("Masuk dulu untuk mengunggah file.");
  if (!file.type.startsWith("image/")) {
    throw new UploadError("Pilih file gambar (JPG, PNG, atau WebP).");
  }
  const blob = await shrinkImage(file, maxSide);
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return uploadToStorage(userId, blob, name, folder);
}

export type StoredFile = { name: string; type: "PDF" | "Galeri" | "Video"; url: string };

/** Upload a brochure, gallery photo or video so visitors can open it. */
export async function uploadMediaFile(userId: string, file: File): Promise<StoredFile> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isVideo && !isImage) {
    throw new UploadError("Format tidak didukung. Gunakan PDF, gambar, atau video.");
  }
  if (isImage) {
    return { name: file.name, type: "Galeri", url: await uploadImage(userId, file, "media", 1600) };
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError("File terlalu besar. Maksimal 20 MB.");
  }
  return { name: file.name, type: isPdf ? "PDF" : "Video", url: await uploadToStorage(userId, file, file.name, "media") };
}

/** Open an uploaded file in a new tab. */
export function openStoredFile(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener");
}
