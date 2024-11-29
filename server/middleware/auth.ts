import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

declare module 'express-serve-static-core' {
  interface Request {
    user?: typeof users.$inferSelect;
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
