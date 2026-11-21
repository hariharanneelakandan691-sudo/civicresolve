import { useState } from "react";
import { ImageOff, Maximize2 } from "lucide-react";
import type { CivicPriority, CivicStatus } from "../types/civic";

const PRIORITY_STYLES: Record<CivicPriority, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-800 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_STYLES: Record<CivicStatus, string> = {
  Reported: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-sky-50 text-sky-800 border-sky-200",
  Resolved: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function PriorityPill({ priority }: { priority: CivicPriority }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 ${PRIORITY_STYLES[priority]}`}
    >
      {priority} Priority
    </span>
  );
}

export function StatusBadge({ status }: { status: CivicStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

interface ComplaintPhotoProps {
  src?: string;
  alt: string;
  onInspect?: (src: string, alt: string) => void;
  className?: string;
}

export function ComplaintPhoto({
  src,
  alt,
  onInspect,
  className = "w-full sm:w-40 aspect-[4/3]",
}: ComplaintPhotoProps) {
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return null;
  }

  if (hasError) {
    return (
      <div
        className={`${className} rounded-lg bg-slate-100 border border-[#E2E8F0] flex flex-col items-center justify-center text-slate-400 shrink-0 p-3 text-center`}
      >
        <ImageOff className="w-5 h-5 mb-1" aria-hidden="true" />
        <span className="text-[11px] font-medium text-slate-500">
          Photo unavailable
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onInspect?.(src, alt)}
      className={`${className} group relative rounded-lg overflow-hidden bg-slate-100 border border-[#E2E8F0] shrink-0 block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]`}
      aria-label={`Inspect photo for ${alt}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-103"
      />
      <span className="absolute bottom-2 right-2 w-7 h-7 rounded-md bg-[#0F172A]/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
