// src/lib/database.ts
import { homeDir, join } from '@tauri-apps/api/path';
import { mkdir } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';

export class ConversationDB {
  private db: Database | null = null;

  // Private constructor – use static create() instead
  private constructor() {}

  // Static factory method to initialize the database asynchronously
  static async create(): Promise<ConversationDB> {
    const instance = new ConversationDB();
    await instance.init();
    return instance;
  }

  // Internal initialization: creates directory, opens DB, sets pragmas, creates table
  private async init(): Promise<void> {
    const home = await homeDir();
    const dbDir = await join(home, 'agent_9');
    await mkdir(dbDir, { recursive: true });
    const dbPath = await join(dbDir, 'main.db');
    this.db = await Database.load(`sqlite:${dbPath}`);

    // Enable recommended pragmas
    await this.db.execute('PRAGMA journal_mode = WAL;');
    await this.db.execute('PRAGMA synchronous = NORMAL;');
    await this.db.execute('PRAGMA foreign_keys = ON;');

    // Create the conversations table if it doesn't exist
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
  }

  // Insert a new message into the conversation
  async insertMessage(sessionId: string, role: string, content: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execute(
      'INSERT INTO conversations (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)',
      [sessionId, role, content, Date.now()]
    );
  }

  // Retrieve all messages for a given session, ordered oldest → newest
  async getConversation(sessionId: string): Promise<Array<{
    id: number;
    session_id: string;
    role: string;
    content: string;
    timestamp: number;
  }>> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.select(
      'SELECT * FROM conversations WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );
    return result as any;
  }
}