import axios from "axios";
import type { Application, Document, Note, User } from "./types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  headers: {
    "Content-Type": "application/json"
  }
});

export function setToken(token: string | null): void {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}): Promise<{ token: string; user: User }> {
  const { data } = await client.post("/auth/register", payload);
  return data;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const { data } = await client.post("/auth/login", payload);
  return data;
}

export async function getProfile(): Promise<User> {
  const { data } = await client.get("/auth/me");
  return data.user;
}

export async function updateProfile(payload: { name: string }): Promise<User> {
  const { data } = await client.put("/auth/me", payload);
  return data.user;
}

export async function listApplications(params?: {
  status?: string;
  search?: string;
  sort?: "appliedDate" | "deadline";
}): Promise<Application[]> {
  const { data } = await client.get("/applications", { params });
  return data.data;
}

export async function createApplication(payload: Partial<Application> & { company: string; role: string }) {
  const { data } = await client.post("/applications", payload);
  return data.data as Application;
}

export async function updateApplication(
  id: string,
  payload: Partial<Application>
): Promise<Application> {
  const { data } = await client.put(`/applications/${id}`, payload);
  return data.data;
}

export async function deleteApplication(id: string): Promise<void> {
  await client.delete(`/applications/${id}`);
}

export async function listNotes(applicationId: string): Promise<Note[]> {
  const { data } = await client.get(`/applications/${applicationId}/notes`);
  return data.data;
}

export async function createNote(applicationId: string, content: string): Promise<Note> {
  const { data } = await client.post(`/applications/${applicationId}/notes`, { content });
  return data.data;
}

export async function updateNote(
  applicationId: string,
  noteId: string,
  content: string
): Promise<Note> {
  const { data } = await client.put(`/applications/${applicationId}/notes/${noteId}`, { content });
  return data.data;
}

export async function deleteNote(applicationId: string, noteId: string): Promise<void> {
  await client.delete(`/applications/${applicationId}/notes/${noteId}`);
}

export async function listDocuments(): Promise<Document[]> {
  const { data } = await client.get("/documents");
  return data.data;
}

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/documents/${id}`);
}

export async function generateFollowupEmail(applicationId: string): Promise<{ draft: string }> {
  const { data } = await client.post("/ai/followup-email", { applicationId });
  return data;
}
