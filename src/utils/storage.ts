import { INITIAL_DEMO_COMPLAINTS } from "../data/seedComplaints";
import type { CivicComplaint } from "../types/civic";

const STORAGE_KEY = "civicresolve_complaints_v1";

export function loadComplaints(): CivicComplaint[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_COMPLAINTS)
      );
      return INITIAL_DEMO_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return INITIAL_DEMO_COMPLAINTS;
    }
    return parsed as CivicComplaint[];
  } catch {
    return INITIAL_DEMO_COMPLAINTS;
  }
}

export function saveComplaints(complaints: CivicComplaint[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    return true;
  } catch {
    // If localStorage quota is exceeded due to large uploaded photos, try stripping old inline data URLs beyond newest 8
    try {
      const trimmed = complaints.map((item, idx) =>
        idx > 7 && item.imageUrl?.startsWith("data:")
          ? { ...item, imageUrl: undefined }
          : item
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function resetDemoComplaints(): CivicComplaint[] {
  saveComplaints(INITIAL_DEMO_COMPLAINTS);
  return INITIAL_DEMO_COMPLAINTS;
}

export function generateCaseNumber(existing: CivicComplaint[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 1042;
  for (const item of existing) {
    const match = /-(\d{4})$/.exec(item.caseNumber);
    if (match) {
      const seq = Number(match[1]);
      if (!Number.isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  return `CR-${year}-${maxSeq + 1}`;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unsupported image data."));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxDim = 960;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
