export const APPLICATION_STATUSES = [
  "Draft",
  "Applied",
  "Online Assessment",
  "Interviewing",
  "Offer",
  "Rejected",
  "Withdrawn"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  location: "remote" | "on-site" | "hybrid";
  deadline: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Note {
  id: string;
  applicationId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
