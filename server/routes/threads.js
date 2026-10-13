import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";

const router = Router();
function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized: Bearer token required" });
  const token = authorization.slice(7).trim();
  if (!token) return res.status(401).json({ error: "Unauthorized: Bearer token required" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); }
  catch { return res.status(401).json({ error: "Unauthorized: invalid or expired token" }); }
}

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
    res.status(201).json(await prisma.thread.create({ data: { title, body, authorId: req.user.userId } }));
  } catch (error) { next(error); }
});
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const { title, body } = req.body ?? {};
    res.json(await prisma.thread.update({ where: { id: Number(req.params.id) }, data: { title, body } }));
  } catch (error) { next(error); }
});
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    await prisma.thread.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
