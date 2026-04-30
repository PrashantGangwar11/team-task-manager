import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  projectId: z.string(),
});
