import type { Express } from "express";
import { db } from "../db";
import { users, quizzes, attempts } from "@db/schema";
import { eq } from "drizzle-orm";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

export function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await db.insert(users).values({
        ...req.body,
        password: hashedPassword
      }).returning();
      res.json(user[0]);
    } catch (error) {
      res.status(500).json({ error: "Error creating user" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in successfully" });
  });

  // Quiz routes
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const quiz = await db.insert(quizzes).values({
        ...req.body,
        userId: req.user?.id
      }).returning();
      res.json(quiz[0]);
    } catch (error) {
      res.status(500).json({ error: "Error generating quiz" });
    }
  });

  app.post("/api/quiz/attempt", async (req, res) => {
    try {
      const attempt = await db.insert(attempts).values({
        ...req.body,
        userId: req.user?.id
      }).returning();
      res.json(attempt[0]);
    } catch (error) {
      res.status(500).json({ error: "Error saving attempt" });
    }
  });

  // Configure passport local strategy
  passport.use(new LocalStrategy({
    usernameField: "email"
  }, async (email, password, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (!user) {
        return done(null, false);
      }

      const isValid = await bcrypt.compare(password, user.password || "");
      if (!isValid) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
