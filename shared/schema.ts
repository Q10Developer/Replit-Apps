import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define candidate status enum
export const candidateStatusEnum = z.enum(['pending', 'shortlisted', 'review', 'rejected']);
export type CandidateStatus = z.infer<typeof candidateStatusEnum>;

// Define the candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  position: text("position").notNull(),
  score: integer("score").notNull(),
  skills: json("skills").$type<Record<string, number>>().notNull(),
  status: text("status").notNull().$type<CandidateStatus>(),
  experience: json("experience").$type<Array<{company: string, role: string, years: string}>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

// Define the CSV upload records
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  totalRecords: integer("total_records").notNull(),
  successfulRecords: integer("successful_records").notNull(),
  failedRecords: integer("failed_records").notNull()
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true
});

export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;

// Define the positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  requiredSkills: json("required_skills").$type<string[]>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Define the notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// CSV file validation schema
export const csvRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  position: z.string().min(1, "Position is required"),
  skills: z.string().min(1, "Skills are required"),
  experience: z.string().optional(),
});

export type CSVRow = z.infer<typeof csvRowSchema>;
