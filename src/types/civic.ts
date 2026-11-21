export const CIVIC_CATEGORIES = [
  "Roads & Potholes",
  "Waste Management",
  "Water & Drainage",
  "Streetlights & Electricity",
  "Public Safety",
] as const;

export type CivicCategory = (typeof CIVIC_CATEGORIES)[number];

export const CIVIC_PRIORITIES = ["High", "Medium", "Low"] as const;
export type CivicPriority = (typeof CIVIC_PRIORITIES)[number];

export const CIVIC_DEPARTMENTS = [
  "Public Works Dept",
  "Sanitation Wing",
  "Water Supply Board",
  "Electrical Dept",
  "Municipal Safety",
] as const;

export type CivicDepartment = (typeof CIVIC_DEPARTMENTS)[number];

export const CIVIC_STATUSES = ["Reported", "In Progress", "Resolved"] as const;
export type CivicStatus = (typeof CIVIC_STATUSES)[number];

export type ActivePortalView = "citizen" | "admin";

export interface TriageOutput {
  category: CivicCategory;
  priority: CivicPriority;
  department: CivicDepartment;
  aiSummary: string;
}

export interface CivicComplaint {
  id: string;
  caseNumber: string;
  title: string;
  location: string;
  description: string;
  imageUrl?: string;
  category: CivicCategory;
  priority: CivicPriority;
  department: CivicDepartment;
  aiSummary: string;
  status: CivicStatus;
  createdAt: string;
  updatedAt: string;
}

export const PRIORITY_WEIGHT: Record<CivicPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export const STATUS_WEIGHT: Record<CivicStatus, number> = {
  Reported: 3,
  "In Progress": 2,
  Resolved: 1,
};
