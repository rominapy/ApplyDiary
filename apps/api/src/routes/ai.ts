import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../utils/prisma.js";

const router = Router();

const followupSchema = z.object({
  applicationId: z.string().uuid()
});

router.use(requireAuth);

router.post("/followup-email", async (req, res) => {
  const parse = followupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ message: "OPENAI_API_KEY is not configured" });
    return;
  }

  const application = await prisma.application.findFirst({
    where: { id: parse.data.applicationId, userId: req.auth!.userId, deletedAt: null }
  });

  if (!application) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { name: true }
  });

  const notes = await prisma.note.findMany({
    where: {
      applicationId: application.id,
      userId: req.auth!.userId,
      deletedAt: null
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const context = {
    userName: user?.name ?? "Applicant",
    company: application.company,
    role: application.role,
    status: application.status,
    appliedDate: application.appliedDate?.toISOString?.() ?? String(application.appliedDate),
    location: application.location,
    notes: notes.map((note) => note.content)
  };

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You draft concise, polite follow-up emails for job applications. Provide a subject line and body. Use the applicant name and applied date when available.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Draft a professional follow-up email. Include a short subject line and a clear body.\n\nContext: ${JSON.stringify(
                context
              )}`
            }
          ]
        }
      ]
    });

    const draft = response.output_text?.trim() ?? "";
    res.json({ draft });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status === 429) {
      res.status(429).json({ message: "AI quota exceeded. Add billing or try again later." });
      return;
    }
    res.status(500).json({ message: "AI generation failed." });
  }
});

export default router;
