import type { ActivePortalView } from "../types/civic";

interface NavbarProps {
  activeView: ActivePortalView;
  onChangeView: (view: ActivePortalView) => void;
}

export function Navbar({ activeView, onChangeView }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onChangeView("citizen")}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669] rounded-md"
        >
          <span
            className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10L12 4L20 10"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 10V18M12 10V18M18 10V18"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M3.5 19.5H20.5"
                stroke="#10B981"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#0F172A]">
            CivicResolve
          </span>
        </button>

        <div
          role="tablist"
          aria-label="Portal view switcher"
          className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-[#E2E8F0] shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "citizen"}
            onClick={() => onChangeView("citizen")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#059669] ${
              activeView === "citizen"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            Citizen Portal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "admin"}
            onClick={() => onChangeView("admin")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#059669] ${
              activeView === "admin"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            Admin Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
