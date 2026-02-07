import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { APPLICATION_STATUSES } from "../types.js";
import { prisma } from "../utils/prisma.js";

const router = Router();

const locationSchema = z.enum(["remote", "on-site", "hybrid"]);

const createApplicationSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  status: z.enum(APPLICATION_STATUSES).default("Draft"),
  appliedDate: z.string().datetime().optional(),
  location: locationSchema.default("remote"),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  source: z.string().max(120).nullable().optional(),
  resumeUrl: z.string().url().max(500).nullable().optional(),
  coverUrl: z.string().url().max(500).nullable().optional()
});

const updateApplicationSchema = createApplicationSchema.partial();
const noteSchema = z.object({
  content: z.string().trim().min(1).max(5000)
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.auth!.userId;
  const status = req.query.status as string | undefined;
  const search = (req.query.search as string | undefined)?.trim().toLowerCase();
  const sort = (req.query.sort as "appliedDate" | "deadline" | undefined) ?? "appliedDate";

  const applications = await prisma.application.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { company: { contains: search, mode: "insensitive" } },
              { role: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy:
      sort === "deadline"
        ? [{ deadline: "desc" }, { appliedDate: "desc" }]
        : [{ appliedDate: "desc" }]
  });

  res.json({ data: applications });
});

router.post("/", async (req, res) => {
  const parse = createApplicationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const userId = req.auth!.userId;
  const now = new Date();
  const application = await prisma.application.create({
    data: {
      userId,
      company: parse.data.company,
      role: parse.data.role,
      status: parse.data.status,
      appliedDate: parse.data.appliedDate ? new Date(parse.data.appliedDate) : now,
      location: parse.data.location,
      deadline: parse.data.deadline ? new Date(parse.data.deadline) : null,
      notes: parse.data.notes ?? null,
      source: parse.data.source ?? null,
      resumeUrl: parse.data.resumeUrl ?? null,
      coverUrl: parse.data.coverUrl ?? null
    }
  });

  res.status(201).json({ data: application });
});

router.put("/:id", async (req, res) => {
  const parse = updateApplicationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const app = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.auth!.userId, deletedAt: null }
  });
  if (!app) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  const updated = await prisma.application.update({
    where: { id: app.id },
    data: {
      ...parse.data,
      ...(parse.data.appliedDate ? { appliedDate: new Date(parse.data.appliedDate) } : {}),
      ...(parse.data.deadline !== undefined
        ? { deadline: parse.data.deadline ? new Date(parse.data.deadline) : null }
        : {})
    }
  });

  res.json({ data: updated });
});

router.delete("/:id", async (req, res) => {
  const app = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.auth!.userId, deletedAt: null }
  });
  if (!app) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  await prisma.application.update({
    where: { id: app.id },
    data: {
      deletedAt: new Date()
    }
  });

  res.status(204).send();
});

router.get("/:id/notes", async (req, res) => {
  const userId = req.auth!.userId;
  const app = await prisma.application.findFirst({
    where: { id: req.params.id, userId, deletedAt: null },
    select: { id: true }
  });

  if (!app) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  const notes = await prisma.note.findMany({
    where: {
      applicationId: app.id,
      userId,
      deletedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: notes });
});

router.post("/:id/notes", async (req, res) => {
  const parse = noteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const userId = req.auth!.userId;
  const app = await prisma.application.findFirst({
    where: { id: req.params.id, userId, deletedAt: null },
    select: { id: true }
  });

  if (!app) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  const note = await prisma.note.create({
    data: {
      applicationId: app.id,
      userId,
      content: parse.data.content
    }
  });

  res.status(201).json({ data: note });
});

router.put("/:id/notes/:noteId", async (req, res) => {
  const parse = noteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const note = await prisma.note.findFirst({
    where: {
      id: req.params.noteId,
      applicationId: req.params.id,
      userId: req.auth!.userId,
      deletedAt: null
    }
  });

  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }

  const updatedNote = await prisma.note.update({
    where: { id: note.id },
    data: { content: parse.data.content }
  });

  res.json({ data: updatedNote });
});

router.delete("/:id/notes/:noteId", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: {
      id: req.params.noteId,
      applicationId: req.params.id,
      userId: req.auth!.userId,
      deletedAt: null
    }
  });

  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }

  await prisma.note.update({
    where: { id: note.id },
    data: { deletedAt: new Date() }
  });

  res.status(204).send();
});

export default router;
