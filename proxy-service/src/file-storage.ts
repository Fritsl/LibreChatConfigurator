import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface StoredFile {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
  expiresAt: Date;
}

export class FileStorage {
  private files: Map<string, StoredFile> = new Map();
  private storageDir: string;
  private ttlDays: number;
  private maxFileSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(storageDir: string = '/tmp/e2b-files', ttlDays: number = 30, maxFileSizeMB: number = 50) {
    this.storageDir = storageDir;
    this.ttlDays = ttlDays;
    this.maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert to bytes
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    
    // Start cleanup job - runs every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredFiles().catch(err => 
        console.error('File cleanup error:', err)
      );
    }, 60 * 60 * 1000);
    
    console.log(`FileStorage initialized: ${this.storageDir}, TTL: ${this.ttlDays} days, Max size: ${this.maxFileSize / 1024 / 1024}MB`);
  }

  async storeFile(userId: string, filename: string, content: Buffer, mimeType: string): Promise<StoredFile> {
    if (content.length > this.maxFileSize) {
      throw new Error(`File size ${content.length} exceeds maximum ${this.maxFileSize} bytes`);
    }

    const fileId = nanoid(21); // Unguessable ID
    const userDir = path.join(this.storageDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const filePath = path.join(userDir, fileId);
    await fs.writeFile(filePath, content);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlDays * 24 * 60 * 60 * 1000);

    const storedFile: StoredFile = {
      id: fileId,
      userId,
      filename,
      mimeType,
      size: content.length,
      path: filePath,
      createdAt: now,
      expiresAt
    };

    this.files.set(fileId, storedFile);
    return storedFile;
  }

  async getFile(fileId: string, userId: string): Promise<StoredFile | null> {
    const file = this.files.get(fileId);
    
    if (!file) return null;
    
    // Verify user owns this file
    if (file.userId !== userId) {
      throw new Error('Unauthorized: File does not belong to this user');
    }
    
    // Check if expired
    if (new Date() > file.expiresAt) {
      await this.deleteFile(fileId);
      return null;
    }
    
    return file;
  }

  async readFileContent(fileId: string, userId: string): Promise<Buffer> {
    const file = await this.getFile(fileId, userId);
    if (!file) {
      throw new Error('File not found or expired');
    }
    return fs.readFile(file.path);
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = this.files.get(fileId);
    if (file) {
      try {
        await fs.unlink(file.path);
      } catch (err) {
        console.error(`Failed to delete file ${fileId}:`, err);
      }
      this.files.delete(fileId);
    }
  }

  private async cleanupExpiredFiles(): Promise<void> {
    const now = new Date();
    const expired: string[] = [];

    for (const [fileId, file] of this.files.entries()) {
      if (now > file.expiresAt) {
        expired.push(fileId);
      }
    }

    console.log(`Cleaning up ${expired.length} expired files`);
    
    for (const fileId of expired) {
      await this.deleteFile(fileId);
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  getStats() {
    return {
      totalFiles: this.files.size,
      storageDir: this.storageDir,
      ttlDays: this.ttlDays,
      maxFileSizeMB: this.maxFileSize / 1024 / 1024
    };
  }
}
