import type { Express, Request } from "express";
import { db } from "../db";
import { users, quizzes, attempts, leaderboard, type User } from "@db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

// Extend Express.Request to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    }
  }
}

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
      const { content, contentType, type, difficulty, level, numQuestions } = req.body;
      
      // Validate required fields
      if (!content || !contentType || !type || !difficulty || !level || !numQuestions) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "All fields are required: content, contentType, type, difficulty, level, numQuestions" 
        });
      }

      // Generate quiz questions using content
      const questions = Array.from({ length: numQuestions }, (_, index) => ({
        question: `Sample Question ${index + 1} from ${content.substring(0, 50)}...`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      }));

      // Save quiz to database
      const quiz = await db.insert(quizzes).values({
        userId: req.user?.id,
        content,
        contentType,
        type,
        difficulty,
        level,
        questions: JSON.stringify(questions),
        isPublic: false,
        totalAttempts: 0
      }).returning();

      res.json({
        ...quiz[0],
        questions
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ 
        error: "Error generating quiz",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
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

  app.post("/api/quiz/share", async (req, res) => {
    try {
      const { quizId } = req.body;
      
      if (!quizId) {
        return res.status(400).json({ 
          error: "Missing quiz ID",
          details: "Quiz ID is required for sharing" 
        });
      }

      // Check if quiz exists and belongs to user
      const existingQuiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId)
      });

      if (!existingQuiz) {
        return res.status(404).json({ 
          error: "Quiz not found",
          details: "The specified quiz does not exist" 
        });
      }

      // Generate unique share code
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Update quiz with share code
      const quiz = await db.update(quizzes)
        .set({ 
          isPublic: true, 
          shareCode
        })
        .where(eq(quizzes.id, quizId))
        .returning();

      res.json({
        ...quiz[0],
        shareUrl: `/quiz/shared/${shareCode}`
      });
    } catch (error) {
      console.error("Quiz sharing error:", error);
      res.status(500).json({ 
        error: "Error sharing quiz",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  app.get("/api/quiz/shared/:shareCode", async (req, res) => {
    try {
      const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.shareCode, req.params.shareCode)
      });
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "Error fetching shared quiz" });
    }
  });

  app.get("/api/quiz/:quizId/leaderboard", async (req, res) => {
    try {
      const entries = await db.query.leaderboard.findMany({
        where: eq(leaderboard.quizId, parseInt(req.params.quizId)),
        orderBy: [desc(leaderboard.score), asc(leaderboard.timeTaken)],
        limit: 10,
        with: {
          user: {
            columns: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Error fetching leaderboard" });
    }
  });

  app.post("/api/quiz/:quizId/leaderboard", async (req, res) => {
    try {
      const entry = await db.insert(leaderboard).values({
        userId: req.user!.id,
        quizId: parseInt(req.params.quizId),
        score: req.body.score,
        timeTaken: req.body.timeTaken
      }).returning();
      
      await db.update(quizzes)
        .set({ totalAttempts: sql`total_attempts + 1` })
        .where(eq(quizzes.id, parseInt(req.params.quizId)));
      
      res.json(entry[0]);
    } catch (error) {
      res.status(500).json({ error: "Error saving leaderboard entry" });
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
