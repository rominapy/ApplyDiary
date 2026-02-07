import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { signAuthToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(120),
  timezone: z.string().trim().min(1).max(100).default("UTC")
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const { password, name, timezone } = parse.data;
  const email = parse.data.email.toLowerCase();

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        timezone
      }
    });

    const token = signAuthToken({ userId: user.id, email: user.email });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone }
    });
  } catch (error) {
    console.error("Register failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      res.status(500).json({
        message: "Unable to create account",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return;
    }

    res.status(500).json({ message: "Unable to create account" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const { password } = parse.data;
  const email = parse.data.email.toLowerCase();
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = signAuthToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone }
    });
  } catch (error) {
    console.error("Login failed:", error);
    if (process.env.NODE_ENV !== "production") {
      res.status(500).json({
        message: "Unable to login",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return;
    }

    res.status(500).json({ message: "Unable to login" });
  }
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, email: true, name: true, timezone: true }
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user });
});

router.put("/me", requireAuth, async (req, res) => {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: "Invalid request payload", issues: parse.error.issues });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { name: parse.data.name },
    select: { id: true, email: true, name: true, timezone: true }
  });

  res.json({ user });
});

export default router;
