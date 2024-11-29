import { generateQuestions } from "./services/openai";
import type { Express, Request } from "express";
import { db } from "../db";
import { users, quizzes, attempts, leaderboard, friends, type User } from "@db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import analyticsRoutes from "./routes/analytics";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import multer from "multer";

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
  // Register analytics routes
  app.use("/api/analytics", analyticsRoutes);
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
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Quiz routes
  app.post("/api/quiz/generate", upload.single('file'), async (req, res) => {
    console.log('Received form data:', {
      body: req.body,
      file: req.file ? { 
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
    try {
      const { content, contentType, type, difficulty, level, numQuestions } = req.body;
      
      // Validate required fields and their types
      const requiredFields = {
        content: content,
        contentType: contentType,
        type: type,
        difficulty: difficulty,
        level: level,
        numQuestions: numQuestions
      };

      // Check for missing fields
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          details: `Missing fields: ${missingFields.join(', ')}`
        });
      }

      // Validate field values
      if (!['text', 'document', 'image'].includes(contentType)) {
        return res.status(400).json({
          error: "Invalid content type",
          details: "Content type must be one of: text, document, image"
        });
      }

      if (!['multiple-choice', 'true-false', 'fill-blank'].includes(type)) {
        return res.status(400).json({
          error: "Invalid quiz type",
          details: "Quiz type must be one of: multiple-choice, true-false, fill-blank"
        });
      }

      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({
          error: "Invalid difficulty",
          details: "Difficulty must be one of: easy, medium, hard"
        });
      }

      if (!['elementary', 'middle', 'high', 'university'].includes(level)) {
        return res.status(400).json({
          error: "Invalid academic level",
          details: "Level must be one of: elementary, middle, high, university"
        });
      }

      const parsedNumQuestions = parseInt(numQuestions);
      if (isNaN(parsedNumQuestions) || parsedNumQuestions < 1 || parsedNumQuestions > 50) {
        return res.status(400).json({
          error: "Invalid number of questions",
          details: "Number of questions must be between 1 and 50"
        });
      }

      // Generate quiz questions using OpenAI
      const questions = await generateQuestions(content, {
        type: type as 'multiple-choice' | 'true-false' | 'fill-blank',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        level: level as 'elementary' | 'middle' | 'high' | 'university',
        numQuestions: parsedNumQuestions
      });

      // Save quiz to database
      const quiz = await db.insert(quizzes).values({
        userId: req.user?.id,
        content,
        contentType,
        type,
        difficulty,
        level,
        numQuestions: parsedNumQuestions,
        questions: JSON.stringify(questions),
        isPublic: false,
        totalAttempts: 0,
        updatedAt: new Date()
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

  // Friend system routes
  app.post("/api/friends/request", async (req, res) => {
    try {
      const { friendEmail } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Find friend by email
      const friend = await db.query.users.findFirst({
        where: eq(users.email, friendEmail)
      });

      if (!friend) {
        return res.status(404).json({ error: "User not found" });
      }

      if (friend.id === req.user.id) {
        return res.status(400).json({ error: "Cannot send friend request to yourself" });
      }

      // Check if friend request already exists
      const existingRequest = await db.query.friends.findFirst({
        where: sql`(user_id = ${req.user.id} AND friend_id = ${friend.id}) 
                  OR (user_id = ${friend.id} AND friend_id = ${req.user.id})`
      });

      if (existingRequest) {
        return res.status(400).json({ 
          error: "Friend request already exists",
          status: existingRequest.status
        });
      }

      // Create friend request
      const request = await db.insert(friends).values({
        userId: req.user.id,
        friendId: friend.id,
        status: "pending"
      }).returning();

      res.json(request[0]);
    } catch (error) {
      res.status(500).json({ error: "Error sending friend request" });
    }
  });

  app.post("/api/friends/respond", async (req, res) => {
    try {
      const { requestId, accept } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Update friend request status
      const request = await db.update(friends)
        .set({ 
          status: accept ? "accepted" : "rejected",
          updatedAt: new Date()
        })
        .where(sql`id = ${requestId} AND friend_id = ${req.user.id} AND status = 'pending'`)
        .returning();

      if (request.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json(request[0]);
    } catch (error) {
      res.status(500).json({ error: "Error responding to friend request" });
    }
  });

  app.get("/api/friends", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("[DEBUG] Getting friends for user:", req.user.id);

      // Get all accepted friends
      const friendsList = await db.query.friends.findMany({
        where: sql`(user_id = ${req.user.id} OR friend_id = ${req.user.id}) 
                  AND status = 'accepted'`,
        with: {
          user: true,
          friend: true
        }
      });

      console.log("[DEBUG] Friends list query result:", JSON.stringify(friendsList, null, 2));
      res.json(friendsList.map(f => ({
        ...f,
        user: f.userId === req.user!.id ? f.friend : f.user
      })));
    } catch (error) {
      console.error("[ERROR] Error fetching friends list:", error);
      res.status(500).json({ 
        error: "Error fetching friends list",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  app.get("/api/friends/requests", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("[DEBUG] Getting friend requests for user:", req.user.id);

      // Get pending friend requests
      const requests = await db.query.friends.findMany({
        where: sql`friend_id = ${req.user.id} AND status = 'pending'`,
        with: {
          user: true,
          friend: true
        }
      });

      console.log("[DEBUG] Friend requests query result:", JSON.stringify(requests, null, 2));
      res.json(requests);
    } catch (error) {
      console.error("[ERROR] Error fetching friend requests:", error);
      res.status(500).json({ 
        error: "Error fetching friend requests",
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
          shareCode,
          updatedAt: new Date()
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
        .set({ totalAttempts: sql`total_attempts + 1`, updatedAt: new Date() })
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
