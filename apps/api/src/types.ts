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

export type ApplicationLocation = "remote" | "on-site" | "hybrid";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  location: ApplicationLocation;
  deadline: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
