import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#E2E8F0]">
          <p className="text-sm font-medium text-[#0F172A] truncate">{alt}</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close photo preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-950 flex items-center justify-center max-h-[75vh]">
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
