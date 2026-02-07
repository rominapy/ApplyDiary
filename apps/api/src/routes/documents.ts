import { Router, type Request } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../utils/prisma.js";

const router = Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadsDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const extension = path.extname(file.originalname);
    cb(null, `${uuidv4()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.auth!.userId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: documents });
});

router.post("/", upload.single("file"), async (req, res) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    res.status(400).json({ message: "File is required" });
    return;
  }

  const document = await prisma.document.create({
    data: {
      userId: req.auth!.userId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      url: `/uploads/${file.filename}`
    }
  });

  res.status(201).json({ data: document });
});

router.delete("/:id", async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.auth!.userId, deletedAt: null }
  });

  if (!doc) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { deletedAt: new Date() }
  });

  res.status(204).send();
});

export default router;
