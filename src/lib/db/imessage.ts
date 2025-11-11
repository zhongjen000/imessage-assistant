import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// iMessage database location on macOS
const IMESSAGE_DB_PATH =
  process.env.IMESSAGE_DB_PATH ||
  path.join(os.homedir(), 'Library', 'Messages', 'chat.db');

export interface IMessageContact {
  id: string;
  phoneNumber: string;
  displayName: string | null;
}

export interface IMessage {
  id: number;
  text: string | null;
  isFromMe: boolean;
  timestamp: number;
  contact: string;
}

export interface ConversationHistory {
  contact: IMessageContact;
  messages: IMessage[];
}

class IMessageDB {
  private db: Database.Database | null = null;

  private getDB(): Database.Database {
    if (!this.db) {
      try {
        // Open in read-only mode since we don't want to modify iMessage DB
        this.db = new Database(IMESSAGE_DB_PATH, { readonly: true });
      } catch (error) {
        throw new Error(
          `Failed to open iMessage database. Ensure you have granted Full Disk Access to Terminal/your IDE. Error: ${error}`
        );
      }
    }
    return this.db;
  }

  /**
   * Get all contacts from iMessage
   */
  getContacts(): IMessageContact[] {
    const db = this.getDB();
    const query = `
      SELECT DISTINCT
        h.ROWID as id,
        h.id as phoneNumber,
        h.display_name as displayName
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      ORDER BY h.display_name, h.id
    `;

    const rows = db.prepare(query).all() as IMessageContact[];
    return rows;
  }

  /**
   * Get conversation history with a specific contact
   */
  getConversationWithContact(contactId: string, limit = 100): IMessage[] {
    const db = this.getDB();
    const query = `
      SELECT
        m.ROWID as id,
        m.text,
        m.is_from_me as isFromMe,
        m.date as timestamp,
        h.id as contact
      FROM message m
      INNER JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      INNER JOIN chat_handle_join chj ON cmj.chat_id = chj.chat_id
      INNER JOIN handle h ON chj.handle_id = h.ROWID
      WHERE h.id = ?
      ORDER BY m.date DESC
      LIMIT ?
    `;

    const rows = db.prepare(query).all(contactId, limit) as IMessage[];
    return rows.reverse(); // Oldest first
  }

  /**
   * Get all messages for analysis (used for style analysis)
   */
  getAllMessagesForContact(contactId: string): IMessage[] {
    const db = this.getDB();
    const query = `
      SELECT
        m.ROWID as id,
        m.text,
        m.is_from_me as isFromMe,
        m.date as timestamp,
        h.id as contact
      FROM message m
      INNER JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      INNER JOIN chat_handle_join chj ON cmj.chat_id = chj.chat_id
      INNER JOIN handle h ON chj.handle_id = h.ROWID
      WHERE h.id = ? AND m.text IS NOT NULL
      ORDER BY m.date ASC
    `;

    const rows = db.prepare(query).all(contactId) as IMessage[];
    return rows;
  }

  /**
   * Search for contacts by name or phone number
   */
  searchContacts(query: string): IMessageContact[] {
    const db = this.getDB();
    const searchQuery = `
      SELECT DISTINCT
        h.ROWID as id,
        h.id as phoneNumber,
        h.display_name as displayName
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      WHERE h.id LIKE ? OR h.display_name LIKE ?
      ORDER BY h.display_name, h.id
      LIMIT 20
    `;

    const searchPattern = `%${query}%`;
    const rows = db.prepare(searchQuery).all(searchPattern, searchPattern) as IMessageContact[];
    return rows;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const imessageDB = new IMessageDB();
