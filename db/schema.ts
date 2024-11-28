import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const quizzes = pgTable("quizzes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  title: text("title"),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // text, document, image
  type: text("type").notNull(), // multiple-choice, true-false, fill-blank
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  level: text("level").notNull(), // elementary, middle, high, university
  questions: jsonb("questions").notNull(),
  numQuestions: integer("num_questions").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  shareCode: text("share_code").unique(),
  totalAttempts: integer("total_attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const attempts = pgTable("attempts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  quizId: integer("quiz_id").references(() => quizzes.id),
  score: integer("score").notNull(),
  answers: jsonb("answers").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const leaderboard = pgTable("leaderboard", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  quizId: integer("quiz_id").references(() => quizzes.id),
  score: integer("score").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertQuizSchema = createInsertSchema(quizzes);
export const selectQuizSchema = createSelectSchema(quizzes);
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = z.infer<typeof selectQuizSchema>;

export const insertAttemptSchema = createInsertSchema(attempts);
export const selectAttemptSchema = createSelectSchema(attempts);
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = z.infer<typeof selectAttemptSchema>;

export const insertLeaderboardSchema = createInsertSchema(leaderboard);
export const selectLeaderboardSchema = createSelectSchema(leaderboard);
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = z.infer<typeof selectLeaderboardSchema>;
