import { Router } from "express";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { quizzes, attempts, leaderboard } from "@db/schema";
import { auth } from "../../server/middleware/auth";

const router = Router();

// Get quiz statistics
router.get("/quiz-stats", auth, async (req, res) => {
  try {
    // Get completion rate data
    const completionRate = await db
      .select({
        date: sql<string>`DATE(${attempts.createdAt})`,
        completed: sql<number>`COUNT(CASE WHEN score > 0 THEN 1 END)`,
        attempted: sql<number>`COUNT(*)`,
      })
      .from(attempts)
      .groupBy(sql`DATE(${attempts.createdAt})`)
      .orderBy(sql`DATE(${attempts.createdAt})`);

    // Get difficulty distribution
    const difficultyDistribution = await db
      .select({
        name: quizzes.difficulty,
        value: sql<number>`COUNT(*)`,
      })
      .from(quizzes)
      .groupBy(quizzes.difficulty);

    res.json({
      completionRate,
      difficultyDistribution,
    });
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    res.status(500).json({ error: "Failed to fetch quiz statistics" });
  }
});

// Get user engagement metrics
router.get("/user-engagement", auth, async (req, res) => {
  try {
    const daily = await db
      .select({
        date: sql<string>`DATE(${attempts.createdAt})`,
        activeUsers: sql<number>`COUNT(DISTINCT ${attempts.userId})`,
        newQuizzes: sql<number>`COUNT(DISTINCT ${quizzes.id})`,
      })
      .from(attempts)
      .leftJoin(quizzes, eq(attempts.quizId, quizzes.id))
      .groupBy(sql`DATE(${attempts.createdAt})`)
      .orderBy(sql`DATE(${attempts.createdAt})`);

    res.json({ daily });
  } catch (error) {
    console.error("Error fetching user engagement:", error);
    res.status(500).json({ error: "Failed to fetch user engagement data" });
  }
});

// Get performance trends
router.get("/performance-trends", auth, async (req, res) => {
  try {
    const weekly = await db
      .select({
        week: sql<string>`DATE_TRUNC('week', ${leaderboard.createdAt})::DATE`,
        avgScore: sql<number>`AVG(${leaderboard.score})`,
        avgTime: sql<number>`AVG(${leaderboard.timeTaken})`,
      })
      .from(leaderboard)
      .groupBy(sql`DATE_TRUNC('week', ${leaderboard.createdAt})::DATE`)
      .orderBy(sql`DATE_TRUNC('week', ${leaderboard.createdAt})::DATE`);

    res.json({ weekly });
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    res.status(500).json({ error: "Failed to fetch performance trends" });
  }
});

export default router;
