import { useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { CitizenPortal } from "./components/CitizenPortal";
import { ImageLightbox } from "./components/ImageLightbox";
import { Navbar } from "./components/Navbar";
import type {
  ActivePortalView,
  CivicComplaint,
  CivicStatus,
} from "./types/civic";
import {
  loadComplaints,
  resetDemoComplaints,
  saveComplaints,
} from "./utils/storage";

export default function App() {
  const [activeView, setActiveView] = useState<ActivePortalView>("citizen");
  const [complaints, setComplaints] = useState<CivicComplaint[]>(() =>
    loadComplaints()
  );
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null
  );

  useEffect(() => {
    saveComplaints(complaints);
  }, [complaints]);

  function handleAddComplaint(newComplaint: CivicComplaint) {
    setComplaints((prev) => [newComplaint, ...prev]);
  }

  function handleUpdateStatus(id: string, nextStatus: CivicStatus) {
    const updatedAt = new Date().toISOString();
    setComplaints((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus, updatedAt } : item
      )
    );
  }

  function handleResetDemo() {
    const seeded = resetDemoComplaints();
    setComplaints(seeded);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar activeView={activeView} onChangeView={setActiveView} />

      <main className="flex-1">
        {activeView === "citizen" ? (
          <CitizenPortal
            complaints={complaints}
            onAddComplaint={handleAddComplaint}
            onInspectPhoto={(src, alt) => setLightbox({ src, alt })}
          />
        ) : (
          <AdminDashboard
            complaints={complaints}
            onUpdateStatus={handleUpdateStatus}
            onResetDemo={handleResetDemo}
            onInspectPhoto={(src, alt) => setLightbox({ src, alt })}
          />
        )}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>CivicResolve Municipal Issue Reporting &amp; Triage</span>
          <span>Data persists locally in your browser storage.</span>
        </div>
      </footer>

      <ImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt ?? ""}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
