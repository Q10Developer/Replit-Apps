import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  candidateStatusEnum,
  csvRowSchema,
  insertCandidateSchema,
  insertNotificationSchema,
  insertUploadSchema,
  type CSVRow,
  type InsertCandidate,
} from "@shared/schema";
import { z } from "zod";

// Helper function to calculate score based on skills
function calculateCandidateScore(
  skills: Record<string, number>,
  positionRequiredSkills: string[]
): number {
  // Simple scoring algorithm
  let totalScore = 0;
  let relevantSkillsCount = 0;

  for (const skill in skills) {
    const skillScore = skills[skill];
    // Boost score if skill is required for the position
    if (positionRequiredSkills.includes(skill)) {
      totalScore += skillScore * 1.5;
      relevantSkillsCount++;
    } else {
      totalScore += skillScore;
    }
  }

  // Boost overall score based on relevance to position
  const relevanceBonus = relevantSkillsCount / positionRequiredSkills.length;
  const finalScore = Math.min(
    Math.round((totalScore / Object.keys(skills).length) * (1 + relevanceBonus)),
    100
  );

  return finalScore;
}

// Parse CSV string to array of objects
async function parseCSV(csvString: string): Promise<CSVRow[]> {
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return new Promise((resolve, reject) => {
    const records: CSVRow[] = [];
    const stream = Readable.from(csvString);

    stream
      .pipe(parser)
      .on("data", (record) => {
        records.push(record);
      })
      .on("end", () => {
        resolve(records);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup proxy middleware to the Flask server
  app.use('/python-api', createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: {
      '^/python-api': '/api', // rewrite path
    },
    logLevel: 'debug'
  }));

  // Setup middleware for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // API routes
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidateById(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  app.post("/api/candidates/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      const validatedStatus = candidateStatusEnum.parse(status);
      
      const updatedCandidate = await storage.updateCandidateStatus(id, validatedStatus);
      
      if (!updatedCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Create notification for status change
      await storage.createNotification({
        message: `Candidate ${updatedCandidate.name} has been marked as ${validatedStatus}`,
        type: "status_change"
      });
      
      res.json(updatedCandidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      res.status(500).json({ message: "Failed to update candidate status" });
    }
  });

  app.post("/api/candidates/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      
      // Validate notes
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      
      const updatedCandidate = await storage.updateCandidateNotes(id, notes);
      
      if (!updatedCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(updatedCandidate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update candidate notes" });
    }
  });

  app.get("/api/positions", async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.get("/api/active-positions", async (req, res) => {
    try {
      const positions = await storage.getActivePositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active positions" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const uploads = await storage.getUploads();
      const positions = await storage.getActivePositions();
      const shortlistedCandidates = candidates.filter(c => c.status === "shortlisted");
      
      // Calculate total time saved (assume 10 minutes per CV)
      const totalCVs = candidates.length;
      const timeSavedMinutes = totalCVs * 10;
      const timeSavedHours = Math.floor(timeSavedMinutes / 60);
      
      res.json({
        totalCVs,
        shortlistedCandidates: shortlistedCandidates.length,
        activePositions: positions.length,
        timeSaved: `${timeSavedHours} hrs`,
        lastUpload: uploads.length > 0 ? uploads[uploads.length - 1].processedAt : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // File upload and processing endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvString = req.file.buffer.toString();
      
      try {
        // Parse CSV data
        const records = await parseCSV(csvString);
        
        let successCount = 0;
        let failedCount = 0;
        const position = req.body.position;
        
        // Get required skills for the position
        const positions = await storage.getPositions();
        const selectedPosition = positions.find(p => p.title === position);
        const requiredSkills = selectedPosition ? selectedPosition.requiredSkills : [];
        
        // Process each record
        for (const record of records) {
          try {
            // Validate record using Zod schema
            const validatedRecord = csvRowSchema.parse(record);
            
            // Process skills string into skills object with scores
            const skillsArray = validatedRecord.skills.split(',').map(s => s.trim());
            const skills: Record<string, number> = {};
            
            // Assign random skill scores (in a real app, this would come from analysis)
            skillsArray.forEach(skill => {
              skills[skill] = Math.floor(Math.random() * 30) + 70; // 70-100 range
            });
            
            // Process experience string
            let experience = undefined;
            if (validatedRecord.experience) {
              const expItems = validatedRecord.experience.split(';').map(item => {
                const [company, role, years] = item.split('|').map(s => s.trim());
                return { company, role, years };
              });
              experience = expItems;
            }
            
            // Calculate candidate score
            const score = calculateCandidateScore(skills, requiredSkills);
            
            // Determine initial status based on score
            let status: "shortlisted" | "review" | "rejected" | "pending" = "pending";
            if (score >= 90) status = "shortlisted";
            else if (score >= 75) status = "review";
            else if (score < 60) status = "rejected";
            
            // Create candidate record
            const candidateData: InsertCandidate = {
              name: validatedRecord.name,
              email: validatedRecord.email,
              position: validatedRecord.position,
              score,
              skills,
              status,
              experience,
              notes: ""
            };
            
            // Validate with insertCandidateSchema
            const validatedCandidate = insertCandidateSchema.parse(candidateData);
            
            // Save to storage
            await storage.createCandidate(validatedCandidate);
            successCount++;
          } catch (err) {
            failedCount++;
            console.error("Failed to process record:", err);
          }
        }
        
        // Create upload record
        const uploadRecord = await storage.createUpload({
          filename: req.file.originalname,
          processedAt: new Date(),
          totalRecords: records.length,
          successfulRecords: successCount,
          failedRecords: failedCount
        });
        
        // Create notification
        await storage.createNotification({
          message: `Processed ${successCount} candidates from ${req.file.originalname}`,
          type: "upload_complete"
        });
        
        res.json({
          success: true,
          message: `Processed ${successCount} candidates successfully. ${failedCount} failed.`,
          upload: uploadRecord
        });
      } catch (err) {
        console.error("CSV parsing error:", err);
        res.status(400).json({ message: "Invalid CSV format" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  app.get("/api/exports", async (req, res) => {
    try {
      // Get filter parameters
      const position = req.query.position as string | undefined;
      const status = req.query.status as string | undefined;
      
      // Get candidates based on filters
      let candidates = await storage.getCandidates();
      
      if (position) {
        candidates = candidates.filter(c => c.position === position);
      }
      
      if (status) {
        candidates = candidates.filter(c => c.status === status);
      }
      
      // Convert to CSV
      const headers = "Name,Email,Position,Score,Status,Skills\n";
      const rows = candidates.map(c => {
        const skills = Object.keys(c.skills).join(', ');
        return `"${c.name}","${c.email}","${c.position}",${c.score},"${c.status}","${skills}"`;
      }).join('\n');
      
      const csv = headers + rows;
      
      // Send back CSV data
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export candidates" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
