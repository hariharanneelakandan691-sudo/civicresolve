import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CIVIC_CATEGORIES,
  CIVIC_STATUSES,
  type CivicComplaint,
  type CivicStatus,
} from "../types/civic";
import { requestAiTriage } from "../services/triageService";
import {
  fileToCompressedDataUrl,
  formatRelativeTime,
  generateCaseNumber,
} from "../utils/storage";
import {
  ComplaintPhoto,
  PriorityPill,
  StatusBadge,
} from "./PriorityAndStatus";

interface CitizenPortalProps {
  complaints: CivicComplaint[];
  onAddComplaint: (complaint: CivicComplaint) => void;
  onInspectPhoto: (src: string, alt: string) => void;
}

export function CitizenPortal({
  complaints,
  onAddComplaint,
  onInspectPhoto,
}: CitizenPortalProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [preferredCategory, setPreferredCategory] = useState<string>("auto");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<CivicComplaint | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState<"All" | CivicStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => {
    const total = complaints.length;
    const inProgress = complaints.filter(
      (c) => c.status === "In Progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return { total, inProgress, resolved };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.caseNumber.toLowerCase().includes(q) ||
        item.aiSummary.toLowerCase().includes(q)
      );
    });
  }, [complaints, statusFilter, searchQuery]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose a valid image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage("Image must be smaller than 12 MB.");
      return;
    }
    setErrorMessage(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setImagePreview(dataUrl);
      setImageFileName(file.name);
    } catch {
      setErrorMessage("Unable to process that photo. Please try another file.");
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setImageFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLastSubmitted(null);

    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || !trimmedLocation || !trimmedDesc) {
      setErrorMessage(
        "Please complete the issue title, location, and detailed description."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const triage = await requestAiTriage({
        title: trimmedTitle,
        location: trimmedLocation,
        description: trimmedDesc,
        preferredCategory,
        imageDataUrl: imagePreview ?? undefined,
      });

      const nowIso = new Date().toISOString();
      const newComplaint: CivicComplaint = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `cr-${Date.now()}`,
        caseNumber: generateCaseNumber(complaints),
        title: trimmedTitle,
        location: trimmedLocation,
        description: trimmedDesc,
        imageUrl: imagePreview ?? undefined,
        category: triage.category,
        priority: triage.priority,
        department: triage.department,
        aiSummary: triage.aiSummary,
        status: "Reported",
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      onAddComplaint(newComplaint);
      setLastSubmitted(newComplaint);

      setTitle("");
      setLocation("");
      setDescription("");
      setPreferredCategory("auto");
      handleRemoveImage();
      setStatusFilter("All");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not complete AI triage right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pb-16">
      {/* Deep Navy Civic Hero Banner */}
      <section className="bg-[#0F172A] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-xs font-medium text-emerald-400 tracking-wide mb-2.5">
                Municipal 311 Citizen Portal
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance leading-tight">
                Report local infrastructure issues and track resolution in real
                time.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Submit a street hazard, sanitation backlog, or utility outage
                with an optional photo. Gemini AI instantly categorizes urgency,
                routes your case to the right city department, and publishes
                live status updates.
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-3 gap-4 pt-4 lg:pt-0 border-t border-slate-800 lg:border-t-0 lg:border-l lg:pl-8">
              <div>
                <p className="text-xs text-slate-400">Logged Cases</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {stats.total}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">In Progress</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-sky-300">
                  {stats.inProgress}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Resolved</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-400">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Citizen Workspace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Civic Issue Reporting Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="pb-4 border-b border-[#E2E8F0]">
                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                  Submit a Civic Report
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Describe the issue below. AI triage assigns priority and
                  department automatically.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-800"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {lastSubmitted && (
                <div
                  role="status"
                  className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-950"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>Report Triaged — {lastSubmitted.caseNumber}</span>
                    </div>
                    <PriorityPill priority={lastSubmitted.priority} />
                  </div>
                  <p className="mt-2 text-xs text-emerald-900/90 leading-relaxed">
                    {lastSubmitted.aiSummary}
                  </p>
                  <p className="mt-2 text-xs text-emerald-800">
                    Routed to{" "}
                    <span className="font-semibold">
                      {lastSubmitted.department}
                    </span>{" "}
                    · {lastSubmitted.category}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="issue-title"
                    className="block text-sm font-medium text-[#0F172A] mb-1.5"
                  >
                    Issue Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="issue-title"
                    type="text"
                    required
                    maxLength={160}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Cracked storm drain leaking onto crosswalk"
                    className="w-full h-10 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="issue-location"
                    className="block text-sm font-medium text-[#0F172A] mb-1.5"
                  >
                    Location (Street or Landmark){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="issue-location"
                      type="text"
                      required
                      maxLength={200}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., 5th Ave & Pine St near West Library"
                      className="w-full h-10 pl-9 pr-3.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="issue-category"
                    className="block text-sm font-medium text-[#0F172A] mb-1.5"
                  >
                    Category{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (Optional — Auto-detected by AI)
                    </span>
                  </label>
                  <select
                    id="issue-category"
                    value={preferredCategory}
                    onChange={(e) => setPreferredCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  >
                    <option value="auto">Auto-detect with Gemini AI</option>
                    {CIVIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="issue-description"
                    className="block text-sm font-medium text-[#0F172A] mb-1.5"
                  >
                    Detailed Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="issue-description"
                    required
                    rows={4}
                    maxLength={2500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Share severity, nearby hazards, how long it has persisted, or whether pedestrian/vehicle traffic is blocked..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-600/15 transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                    Photo Evidence{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (Optional — analyzed by Gemini Vision)
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    id="issue-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  {!imagePreview ? (
                    <label
                      htmlFor="issue-photo"
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-lg border border-dashed border-slate-300 bg-[#F8FAFC] hover:bg-slate-100/70 hover:border-slate-400 transition-colors cursor-pointer text-center"
                    >
                      <Upload
                        className="w-5 h-5 text-slate-500"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-[#0F172A]">
                        Upload a site photo
                      </span>
                      <span className="text-xs text-slate-500">
                        JPG, PNG, or WebP up to 12 MB
                      </span>
                    </label>
                  ) : (
                    <div className="rounded-lg border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC]">
                      <div className="relative aspect-[16/10] bg-slate-900">
                        <img
                          src={imagePreview}
                          alt="Uploaded civic issue preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between gap-2 bg-white border-t border-[#E2E8F0]">
                        <span className="text-xs text-slate-600 truncate">
                          {imageFileName || "Selected photo"}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 px-4 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:opacity-65 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          aria-hidden="true"
                        />
                        <span>Analyzing with Gemini AI...</span>
                      </>
                    ) : (
                      <span>Submit Report &amp; Run AI Triage</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Issue Tracking Dashboard */}
          <div className="lg:col-span-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0F172A]">
                  Issue Tracking Dashboard
                </h2>
                <p className="text-sm text-slate-600">
                  Live municipal queue synced with city operations.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                Showing {filteredComplaints.length} of {complaints.length} cases
              </span>
            </div>

            {/* Citizen Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
              <div
                role="group"
                aria-label="Filter reports by status"
                className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-[#E2E8F0] overflow-x-auto"
              >
                {(["All", ...CIVIC_STATUSES] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === tab
                        ? "bg-white text-[#0F172A] shadow-xs"
                        : "text-slate-600 hover:text-[#0F172A]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search street, ID, category..."
                  aria-label="Search citizen reports"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#059669]"
                />
              </div>
            </div>

            {/* Complaint Tracking Cards */}
            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center">
                <p className="font-display text-base font-semibold text-[#0F172A]">
                  No matching civic reports
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Adjust your search or status filter, or submit a new issue on
                  the left.
                </p>
                {(statusFilter !== "All" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("All");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <article
                    key={complaint.id}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-5 transition-colors hover:border-slate-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {complaint.imageUrl && (
                        <ComplaintPhoto
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          onInspect={onInspectPhoto}
                          className="w-full sm:w-40 aspect-[4/3]"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                            <span className="font-semibold text-[#0F172A]">
                              {complaint.caseNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {formatRelativeTime(complaint.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PriorityPill priority={complaint.priority} />
                            <StatusBadge status={complaint.status} />
                          </div>
                        </div>

                        <h3 className="mt-2 font-display text-base font-bold text-[#0F172A] leading-snug">
                          {complaint.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin
                            className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{complaint.location}</span>
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500">
                            AI Dispatch Summary
                          </p>
                          <p className="mt-0.5 text-sm text-slate-700 leading-relaxed">
                            {complaint.aiSummary}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span>
                            Category:{" "}
                            <strong className="font-semibold text-[#0F172A]">
                              {complaint.category}
                            </strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Department:{" "}
                            <strong className="font-semibold text-[#0F172A]">
                              {complaint.department}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
