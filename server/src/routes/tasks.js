import { Router } from "express";
import { taskSchema } from "../utils/validation.js";

export const tasksRouter = Router();

const membership = async (prisma, projectId, userId) =>
  prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId } } });

tasksRouter.get("/project/:projectId", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const { projectId } = req.params;
    const member = await membership(prisma, projectId, req.user.userId);
    if (!member) return res.status(403).json({ message: "Not a project member" });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const body = taskSchema.parse(req.body);
    const member = await membership(prisma, body.projectId, req.user.userId);
    if (!member) return res.status(403).json({ message: "Not a project member" });

    if (body.assigneeId) {
      const assigneeMember = await membership(prisma, body.projectId, body.assigneeId);
      if (!assigneeMember) return res.status(400).json({ message: "Assignee must be project member" });
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assigneeId: body.assigneeId,
        status: body.status || "TODO",
        projectId: body.projectId,
        createdById: req.user.userId,
      },
    });
    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
});

tasksRouter.patch("/:taskId/status", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const { taskId } = req.params;
    const { status } = req.body;
    if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const member = await membership(prisma, task.projectId, req.user.userId);
    if (!member) return res.status(403).json({ message: "Not a project member" });

    const updated = await prisma.task.update({ where: { id: taskId }, data: { status } });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});
