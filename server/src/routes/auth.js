import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, signupSchema } from "../utils/validation.js";

export const authRouter = Router();

const signToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

authRouter.post("/signup", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash },
      select: { id: true, name: true, email: true },
    });
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return next(err);
  }
});
