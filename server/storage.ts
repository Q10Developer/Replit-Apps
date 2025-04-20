import { 
  candidates, type Candidate, type InsertCandidate,
  uploads, type Upload, type InsertUpload,
  positions, type Position, type InsertPosition,
  notifications, type Notification, type InsertNotification,
  CandidateStatus
} from "@shared/schema";

// Define interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Candidate operations
  getCandidates(): Promise<Candidate[]>;
  getCandidateById(id: number): Promise<Candidate | undefined>;
  getCandidatesByPosition(position: string): Promise<Candidate[]>;
  getCandidatesByStatus(status: CandidateStatus): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidateStatus(id: number, status: CandidateStatus): Promise<Candidate | undefined>;
  updateCandidateNotes(id: number, notes: string): Promise<Candidate | undefined>;
  
  // Upload operations
  getUploads(): Promise<Upload[]>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  
  // Position operations
  getPositions(): Promise<Position[]>;
  getActivePositions(): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  
  // Notification operations
  getNotifications(): Promise<Notification[]>;
  getUnreadNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private candidatesMap: Map<number, Candidate>;
  private uploadsMap: Map<number, Upload>;
  private positionsMap: Map<number, Position>;
  private notificationsMap: Map<number, Notification>;
  currentUserId: number;
  currentCandidateId: number;
  currentUploadId: number;
  currentPositionId: number;
  currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.candidatesMap = new Map();
    this.uploadsMap = new Map();
    this.positionsMap = new Map();
    this.notificationsMap = new Map();
    this.currentUserId = 1;
    this.currentCandidateId = 1;
    this.currentUploadId = 1;
    this.currentPositionId = 1;
    this.currentNotificationId = 1;
    
    // Initialize with sample positions
    this.createPosition({
      title: "Frontend Developer",
      department: "Engineering",
      requiredSkills: ["React", "TypeScript", "CSS"],
      active: true
    });
    
    this.createPosition({
      title: "Backend Developer",
      department: "Engineering",
      requiredSkills: ["Node.js", "Express", "MongoDB"],
      active: true
    });
    
    this.createPosition({
      title: "UX Designer",
      department: "Design",
      requiredSkills: ["Figma", "UI/UX", "Prototyping"],
      active: true
    });
    
    this.createPosition({
      title: "Data Analyst",
      department: "Data Science",
      requiredSkills: ["Python", "SQL", "Data Visualization"],
      active: true
    });
  }

  // User operations
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: any): Promise<any> {
    const id = this.currentUserId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Candidate operations
  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidatesMap.values());
  }

  async getCandidateById(id: number): Promise<Candidate | undefined> {
    return this.candidatesMap.get(id);
  }

  async getCandidatesByPosition(position: string): Promise<Candidate[]> {
    return Array.from(this.candidatesMap.values()).filter(
      (candidate) => candidate.position === position
    );
  }

  async getCandidatesByStatus(status: CandidateStatus): Promise<Candidate[]> {
    return Array.from(this.candidatesMap.values()).filter(
      (candidate) => candidate.status === status
    );
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentCandidateId++;
    const newCandidate: Candidate = {
      ...candidate,
      id,
      createdAt: new Date()
    };
    this.candidatesMap.set(id, newCandidate);
    return newCandidate;
  }

  async updateCandidateStatus(id: number, status: CandidateStatus): Promise<Candidate | undefined> {
    const candidate = this.candidatesMap.get(id);
    if (!candidate) return undefined;
    
    const updatedCandidate = { ...candidate, status };
    this.candidatesMap.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async updateCandidateNotes(id: number, notes: string): Promise<Candidate | undefined> {
    const candidate = this.candidatesMap.get(id);
    if (!candidate) return undefined;
    
    const updatedCandidate = { ...candidate, notes };
    this.candidatesMap.set(id, updatedCandidate);
    return updatedCandidate;
  }

  // Upload operations
  async getUploads(): Promise<Upload[]> {
    return Array.from(this.uploadsMap.values());
  }

  async createUpload(upload: InsertUpload): Promise<Upload> {
    const id = this.currentUploadId++;
    const newUpload: Upload = { ...upload, id };
    this.uploadsMap.set(id, newUpload);
    return newUpload;
  }

  // Position operations
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positionsMap.values());
  }

  async getActivePositions(): Promise<Position[]> {
    return Array.from(this.positionsMap.values()).filter(
      (position) => position.active
    );
  }

  async getPositionById(id: number): Promise<Position | undefined> {
    return this.positionsMap.get(id);
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const id = this.currentPositionId++;
    const newPosition: Position = {
      ...position,
      id,
      createdAt: new Date()
    };
    this.positionsMap.set(id, newPosition);
    return newPosition;
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const existingPosition = this.positionsMap.get(id);
    if (!existingPosition) return undefined;
    
    const updatedPosition = { ...existingPosition, ...position };
    this.positionsMap.set(id, updatedPosition);
    return updatedPosition;
  }

  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values());
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values()).filter(
      (notification) => !notification.read
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date()
    };
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
