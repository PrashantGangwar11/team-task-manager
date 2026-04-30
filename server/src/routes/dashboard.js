import { Router } from "express";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const memberships = await prisma.projectMembership.findMany({
      where: { userId: req.user.userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      select: { status: true, dueDate: true },
    });

    const now = new Date();
    const summary = tasks.reduce(
      (acc, t) => {
        acc.total += 1;
        acc[t.status] += 1;
        if (t.dueDate && t.dueDate < now && t.status !== "DONE") acc.overdue += 1;
        return acc;
      },
      { total: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0, overdue: 0 }
    );
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
});
