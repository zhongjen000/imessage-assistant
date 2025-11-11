import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const CONTEXT_DB_PATH = process.env.CONTEXT_DB_PATH || path.join(process.cwd(), 'data', 'context.db');

// Ensure data directory exists
const dataDir = path.dirname(CONTEXT_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface Contact {
  id: number;
  phoneNumber: string;
  name: string | null;
  relationshipType: string | null;
  formalityLevel: 'casual' | 'neutral' | 'formal' | null;
  communicationStyle: string | null; // JSON string
  backgroundContext: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserContext {
  id: number;
  contextType: string;
  content: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface ContextHistory {
  id: number;
  contactId: number;
  contextText: string;
  createdAt: string;
}

class ContextDB {
  private db: Database.Database;

  constructor() {
    this.db = new Database(CONTEXT_DB_PATH);
    this.initTables();
  }

  private initTables() {
    // Contacts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        relationship_type TEXT,
        formality_level TEXT CHECK(formality_level IN ('casual', 'neutral', 'formal')),
        communication_style TEXT,
        background_context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User context table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        context_type TEXT NOT NULL,
        content TEXT NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Context history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        context_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )
    `);
  }

  // Contact operations
  getContact(phoneNumber: string): Contact | null {
    const query = `SELECT * FROM contacts WHERE phone_number = ?`;
    return this.db.prepare(query).get(phoneNumber) as Contact | undefined || null;
  }

  getAllContacts(): Contact[] {
    const query = `SELECT * FROM contacts ORDER BY updated_at DESC`;
    return this.db.prepare(query).all() as Contact[];
  }

  upsertContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
    const query = `
      INSERT INTO contacts (phone_number, name, relationship_type, formality_level, communication_style, background_context)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(phone_number) DO UPDATE SET
        name = excluded.name,
        relationship_type = excluded.relationship_type,
        formality_level = excluded.formality_level,
        communication_style = excluded.communication_style,
        background_context = excluded.background_context,
        updated_at = CURRENT_TIMESTAMP
    `;

    this.db.prepare(query).run(
      contact.phoneNumber,
      contact.name,
      contact.relationshipType,
      contact.formalityLevel,
      contact.communicationStyle,
      contact.backgroundContext
    );

    return this.getContact(contact.phoneNumber);
  }

  updateContactContext(phoneNumber: string, backgroundContext: string) {
    const query = `
      UPDATE contacts
      SET background_context = ?, updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
    `;

    this.db.prepare(query).run(backgroundContext, phoneNumber);
    return this.getContact(phoneNumber);
  }

  // User context operations
  getUserContext(): UserContext[] {
    const query = `
      SELECT * FROM user_context
      WHERE end_date IS NULL OR end_date >= datetime('now')
      ORDER BY created_at DESC
    `;
    return this.db.prepare(query).all() as UserContext[];
  }

  addUserContext(context: Omit<UserContext, 'id' | 'createdAt'>) {
    const query = `
      INSERT INTO user_context (context_type, content, start_date, end_date)
      VALUES (?, ?, ?, ?)
    `;

    const info = this.db.prepare(query).run(
      context.contextType,
      context.content,
      context.startDate,
      context.endDate
    );

    return this.db.prepare('SELECT * FROM user_context WHERE id = ?').get(info.lastInsertRowid) as UserContext;
  }

  deleteUserContext(id: number) {
    const query = `DELETE FROM user_context WHERE id = ?`;
    this.db.prepare(query).run(id);
  }

  // Context history operations
  addContextHistory(contactId: number, contextText: string) {
    const query = `
      INSERT INTO context_history (contact_id, context_text)
      VALUES (?, ?)
    `;

    this.db.prepare(query).run(contactId, contextText);
  }

  getContextHistory(contactId: number, limit = 50): ContextHistory[] {
    const query = `
      SELECT * FROM context_history
      WHERE contact_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return this.db.prepare(query).all(contactId, limit) as ContextHistory[];
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const contextDB = new ContextDB();
