import { Router } from "express";
import prisma from "../prisma/client.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();

// Public read endpoint.
router.get("/", async (req, res, next) => {
  try {
    const take = Number(req.query.take) || 10;
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const threads = await prisma.thread.findMany({
      take, skip: cursor ? 1 : 0, cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
      include: { author: { select: { name: true, avatarUrl: true } }, _count: { select: { comments: true } } },
    });
    res.json({ threads, nextCursor: threads[threads.length - 1]?.id ?? null });
  } catch (error) { next(error); }
});

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { title, body } = req.body ?? {};
    if (!title || !body) return res.status(400).json({ error: "title and body are required" });
    const thread = await prisma.thread.create({ data: { title, body, authorId: req.user.userId } });
    res.status(201).json(thread);
  } catch (error) { next(error); }
});

router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, body } = req.body ?? {};
    res.json(await prisma.thread.update({ where: { id }, data: { title, body } }));
  } catch (error) { next(error); }
});

router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    await prisma.thread.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
