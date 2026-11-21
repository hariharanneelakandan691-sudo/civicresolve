import { useMemo, useState } from "react";
import { MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import {
  CIVIC_CATEGORIES,
  CIVIC_PRIORITIES,
  CIVIC_STATUSES,
  PRIORITY_WEIGHT,
  STATUS_WEIGHT,
  type CivicCategory,
  type CivicComplaint,
  type CivicPriority,
  type CivicStatus,
} from "../types/civic";
import { formatRelativeTime } from "../utils/storage";
import {
  ComplaintPhoto,
  PriorityPill,
  StatusBadge,
} from "./PriorityAndStatus";

interface AdminDashboardProps {
  complaints: CivicComplaint[];
  onUpdateStatus: (id: string, status: CivicStatus) => void;
  onResetDemo: () => void;
  onInspectPhoto: (src: string, alt: string) => void;
}

export function AdminDashboard({
  complaints,
  onUpdateStatus,
  onResetDemo,
  onInspectPhoto,
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"All" | CivicPriority>(
    "All"
  );
  const [categoryFilter, setCategoryFilter] = useState<"All" | CivicCategory>(
    "All"
  );
  const [statusFilter, setStatusFilter] = useState<"All" | CivicStatus>("All");

  const metrics = useMemo(() => {
    const total = complaints.length;
    const highPriority = complaints.filter((c) => c.priority === "High").length;
    const inProgress = complaints.filter(
      (c) => c.status === "In Progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return { total, highPriority, inProgress, resolved };
  }, [complaints]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== "All" ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  const sortedAndFilteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return complaints
      .filter((item) => {
        if (priorityFilter !== "All" && item.priority !== priorityFilter) {
          return false;
        }
        if (categoryFilter !== "All" && item.category !== categoryFilter) {
          return false;
        }
        if (statusFilter !== "All" && item.status !== statusFilter) {
          return false;
        }
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.aiSummary.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.caseNumber.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const prioDiff =
          PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (prioDiff !== 0) return prioDiff;

        const statusDiff = STATUS_WEIGHT[b.status] - STATUS_WEIGHT[a.status];
        if (statusDiff !== 0) return statusDiff;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [complaints, searchQuery, priorityFilter, categoryFilter, statusFilter]);

  function clearFilters() {
    setSearchQuery("");
    setPriorityFilter("All");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  return (
    <div className="pb-16">
      {/* Admin Header Strip */}
      <section className="bg-[#0F172A] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-400 tracking-wide mb-1.5">
              Municipal Operations Console
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Priority Triage &amp; Dispatch Queue
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-2xl">
              Review AI-classified civic reports ordered by urgency and update
              field resolution status in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* KPI Summary Row */}
        <section aria-label="Key municipal metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <p className="text-xs font-medium text-slate-500">
                Total Complaints
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#0F172A]">
                {metrics.total}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                All logged municipal cases
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <p className="text-xs font-medium text-slate-500">
                High Priority Issues
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-red-600">
                {metrics.highPriority}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Urgent safety &amp; transit impact
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <p className="text-xs font-medium text-slate-500">In Progress</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-sky-700">
                {metrics.inProgress}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Assigned to field crews
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <p className="text-xs font-medium text-slate-500">Resolved</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#059669]">
                {metrics.resolved}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Verified completed work
              </p>
            </div>
          </div>
        </section>

        {/* Filter & Search Controls */}
        <section
          aria-label="Filter and search triage queue"
          className="bg-white rounded-xl border border-[#E2E8F0] p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case ID, title, location, department..."
                aria-label="Search triage queue"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#059669]"
              />
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as "All" | CivicPriority)
                }
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669]"
              >
                <option value="All">All Priorities</option>
                {CIVIC_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "All" | CivicCategory)
                }
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669]"
              >
                <option value="All">All Categories</option>
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "All" | CivicStatus)
                }
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669]"
              >
                <option value="All">All Statuses</option>
                {CIVIC_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex justify-end">
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Priority Triage Queue */}
        <section aria-label="Priority Triage Queue">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="w-4 h-4 text-slate-500"
                aria-hidden="true"
              />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Priority Triage Queue
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Sorted automatically by urgency (High Priority first)
              </span>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
              {sortedAndFilteredQueue.length} shown
            </span>
          </div>

          {sortedAndFilteredQueue.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <p className="font-display text-base font-semibold text-[#0F172A]">
                No complaints match the current filters
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try broadening your priority, category, or status filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
              {sortedAndFilteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-5 lg:items-start justify-between">
                    {/* Left: Thumbnail + Full Case Info */}
                    <div className="flex flex-col sm:flex-row gap-4 min-w-0 flex-1">
                      {item.imageUrl && (
                        <ComplaintPhoto
                          src={item.imageUrl}
                          alt={item.title}
                          onInspect={onInspectPhoto}
                          className="w-full sm:w-36 aspect-[4/3]"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#0F172A] tabular-nums">
                            {item.caseNumber}
                          </span>
                          <PriorityPill priority={item.priority} />
                          <span className="text-xs text-slate-400">·</span>
                          <span className="font-mono text-xs text-slate-500 tabular-nums">
                            Logged {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <h3 className="mt-1.5 font-display text-base font-bold text-[#0F172A]">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin
                            className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{item.location}</span>
                        </p>

                        <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold text-[#0F172A]">
                            AI Summary:{" "}
                          </span>
                          {item.aiSummary}
                        </p>

                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                          Citizen note: {item.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span>
                            Category:{" "}
                            <strong className="font-semibold text-[#0F172A]">
                              {item.category}
                            </strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Assigned Dept:{" "}
                            <strong className="font-semibold text-[#0F172A]">
                              {item.department}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Interactive Status Management */}
                    <div className="lg:w-52 shrink-0 flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="flex items-center lg:justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          Current Status
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="w-44 lg:w-full">
                        <label
                          htmlFor={`status-${item.id}`}
                          className="sr-only"
                        >
                          Update status for {item.title}
                        </label>
                        <select
                          id={`status-${item.id}`}
                          value={item.status}
                          onChange={(e) =>
                            onUpdateStatus(
                              item.id,
                              e.target.value as CivicStatus
                            )
                          }
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:border-slate-300 text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-600/15 transition-colors cursor-pointer"
                        >
                          {CIVIC_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
