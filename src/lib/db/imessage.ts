import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

// iMessage database location on macOS
const IMESSAGE_DB_PATH =
  process.env.IMESSAGE_DB_PATH ||
  path.join(os.homedir(), 'Library', 'Messages', 'chat.db');

export interface IMessageContact {
  id: string;
  phoneNumber: string;
  displayName: string | null;
}

export interface IMessageContactWithPreview extends IMessageContact {
  lastMessageText: string | null;
  lastMessageTimestamp: number | null;
  lastMessageIsFromMe: boolean;
  hasUnread: boolean;
}

export interface IMessage {
  id: number;
  text: string | null;
  isFromMe: boolean;
  timestamp: number;
  contact: string;
}

/**
 * Extract text from attributedBody binary plist
 * attributedBody contains NSAttributedString with text and attachments
 */
function extractTextFromAttributedBody(attributedBody: Buffer | null): string | null {
  if (!attributedBody) return null;

  try {
    // Convert buffer to string and look for readable text
    // The format is a binary plist, but we can extract plain text by looking for it
    const str = attributedBody.toString('utf8');

    // Use regex to find text between NSString markers
    // This is a simplified extraction - real NSKeyedArchiver decoding is complex
    const textMatches = str.match(/[\x20-\x7E]{3,}/g);

    if (textMatches && textMatches.length > 0) {
      // Filter out common NSAttributedString metadata and technical strings
      const filtered = textMatches.filter(t => {
        const lower = t.toLowerCase();
        // Clean up the string - remove leading special characters
        const cleaned = t.replace(/^[^a-zA-Z0-9\s]+/, '').trim();

        return (
          cleaned.length > 2 &&
          !t.includes('NSAttributedString') &&
          !t.includes('NSString') &&
          !t.includes('NSDictionary') &&
          !t.includes('NSObject') &&
          !t.includes('__kIM') &&
          !t.startsWith('NS') &&
          !lower.includes('streamtyped') &&
          !lower.includes('com.apple') &&
          !lower.includes('.plist') &&
          !lower.includes('$class') &&
          !lower.includes('archiver') &&
          !t.startsWith('$') &&
          !t.startsWith('_') &&
          !t.startsWith('+') &&
          !t.startsWith('#') &&
          !t.startsWith('@') &&
          // Check if it starts with a letter or number after cleaning
          /^[a-zA-Z0-9]/.test(cleaned)
        );
      });

      if (filtered.length > 0) {
        // Return the longest match after cleaning
        const longest = filtered.reduce((a, b) => a.length > b.length ? a : b);
        // Clean up leading special characters from the result
        return longest.replace(/^[^a-zA-Z0-9\s]+/, '').trim();
      }
    }
  } catch (error) {
    // If extraction fails, return null
  }

  return null;
}

export interface ConversationHistory {
  contact: IMessageContact;
  messages: IMessage[];
}

// Cache for contact names from Contacts.app
const contactNameCache = new Map<string, string | null>();
let allContactsLoaded = false;

/**
 * Load all contacts from macOS Contacts database (SQL - fast!)
 */
function loadAllContactNames(): void {
  if (allContactsLoaded) return;

  try {
    const addressBookDir = path.join(
      os.homedir(),
      'Library/Application Support/AddressBook'
    );

    // Find all Contacts database files (main + sources)
    const dbPaths = [
      path.join(addressBookDir, 'AddressBook-v22.abcddb')
    ];

    // Add source databases
    const sourcesDir = path.join(addressBookDir, 'Sources');
    if (fs.existsSync(sourcesDir)) {
      const sources = fs.readdirSync(sourcesDir);
      for (const source of sources) {
        const sourceDbPath = path.join(sourcesDir, source, 'AddressBook-v22.abcddb');
        if (fs.existsSync(sourceDbPath)) {
          dbPaths.push(sourceDbPath);
        }
      }
    }

    const query = `
      SELECT
        p.ZFIRSTNAME,
        p.ZLASTNAME,
        ph.ZFULLNUMBER
      FROM ZABCDPHONENUMBER ph
      INNER JOIN ZABCDRECORD p ON ph.ZOWNER = p.Z_PK
      WHERE ph.ZFULLNUMBER IS NOT NULL
    `;

    // Query all databases
    for (const dbPath of dbPaths) {
      try {
        const contactsDb = new Database(dbPath, { readonly: true });
        const rows = contactsDb.prepare(query).all() as Array<{
          ZFIRSTNAME: string | null;
          ZLASTNAME: string | null;
          ZFULLNUMBER: string;
        }>;

        for (const row of rows) {
          const firstName = row.ZFIRSTNAME || '';
          const lastName = row.ZLASTNAME || '';
          const fullName = `${firstName} ${lastName}`.trim();

          if (fullName && row.ZFULLNUMBER) {
            // Clean phone number and store with last 10 digits as key
            const cleanPhone = row.ZFULLNUMBER.replace(/\D/g, '');
            const last10 = cleanPhone.slice(-10);
            if (last10) {
              contactNameCache.set(last10, fullName);
            }
          }
        }

        contactsDb.close();
      } catch (err) {
        // Skip databases that fail to open
        console.warn(`Skipping contacts database ${dbPath}:`, err);
      }
    }

    allContactsLoaded = true;
  } catch (error) {
    console.error('Failed to load contacts from Contacts database:', error);
    allContactsLoaded = true; // Mark as loaded to avoid retry
  }
}

/**
 * Get contact name from cache (must call loadAllContactNames first)
 */
function getContactNameFromContacts(phoneNumber: string): string | null {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const last10 = cleanNumber.slice(-10);
  return contactNameCache.get(last10) || null;
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
        c.display_name as displayName
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      INNER JOIN chat c ON chj.chat_id = c.ROWID
      ORDER BY c.display_name, h.id
    `;

    const rows = db.prepare(query).all() as IMessageContact[];
    return rows;
  }

  /**
   * Get all contacts with their last message preview (for iMessage-like display)
   */
  getContactsWithPreview(): IMessageContactWithPreview[] {
    const db = this.getDB();
    const query = `
      WITH latest_messages AS (
        SELECT
          h.id as phoneNumber,
          m.text,
          m.date,
          m.is_from_me,
          m.is_read,
          ROW_NUMBER() OVER (PARTITION BY h.id ORDER BY m.date DESC) as rn
        FROM message m
        INNER JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
        INNER JOIN chat_handle_join chj ON cmj.chat_id = chj.chat_id
        INNER JOIN handle h ON chj.handle_id = h.ROWID
      )
      SELECT
        MIN(h.ROWID) as id,
        h.id as phoneNumber,
        MAX(c.display_name) as displayName,
        lm.text as lastMessageText,
        lm.date as lastMessageTimestamp,
        lm.is_from_me as lastMessageIsFromMe,
        CASE
          WHEN lm.is_from_me = 1 THEN 0
          WHEN lm.is_read = 1 THEN 0
          ELSE 1
        END as hasUnread
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      INNER JOIN chat c ON chj.chat_id = c.ROWID
      INNER JOIN latest_messages lm ON lm.phoneNumber = h.id AND lm.rn = 1
      GROUP BY h.id
      ORDER BY lm.date DESC
    `;

    const rows = db.prepare(query).all() as IMessageContactWithPreview[];

    // Load all contact names from Contacts.app in one bulk operation
    loadAllContactNames();

    // Enrich with names from Contacts.app cache
    return rows.map((contact) => {
      // ALWAYS try Contacts first (more accurate than chat display name which might be a group name)
      const contactsName = getContactNameFromContacts(contact.phoneNumber);
      if (contactsName) {
        return { ...contact, displayName: contactsName };
      }
      // Fall back to chat display name if Contacts doesn't have it
      return contact;
    });
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
        m.attributedBody,
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

    const rows = db.prepare(query).all(contactId, limit) as Array<IMessage & { attributedBody: Buffer | null }>;

    // Extract text from attributedBody if text is empty
    const messages = rows.map(row => {
      let text = row.text;
      if (!text && row.attributedBody) {
        text = extractTextFromAttributedBody(row.attributedBody);
      }
      return {
        id: row.id,
        text,
        isFromMe: row.isFromMe,
        timestamp: row.timestamp,
        contact: row.contact,
      };
    });

    return messages.reverse(); // Oldest first
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
        c.display_name as displayName
      FROM handle h
      INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
      INNER JOIN chat c ON chj.chat_id = c.ROWID
      WHERE h.id LIKE ? OR c.display_name LIKE ?
      ORDER BY c.display_name, h.id
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
