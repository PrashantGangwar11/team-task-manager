import { Router } from "express";
import { inviteSchema, projectSchema } from "../utils/validation.js";

export const projectsRouter = Router();

const getMembership = async (prisma, projectId, userId) =>
  prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId } } });

projectsRouter.get("/", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const projects = await prisma.projectMembership.findMany({
      where: { userId: req.user.userId },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(projects);
  } catch (err) {
    return next(err);
  }
});

projectsRouter.post("/", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const body = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        memberships: { create: { userId: req.user.userId, role: "ADMIN" } },
      },
    });
    return res.status(201).json(project);
  } catch (err) {
    return next(err);
  }
});

projectsRouter.post("/:projectId/invite", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const { projectId } = req.params;
    const body = inviteSchema.parse(req.body);
    const me = await getMembership(prisma, projectId, req.user.userId);
    if (!me || me.role !== "ADMIN") return res.status(403).json({ message: "Admin only action" });

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const membership = await prisma.projectMembership.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      create: { projectId, userId: user.id, role: body.role },
      update: { role: body.role },
    });
    return res.json(membership);
  } catch (err) {
    return next(err);
  }
});
