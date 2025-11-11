# iMessage Assistant - Project Scope

## Overview
An intelligent macOS desktop application that generates contextually-aware message suggestions for iMessage conversations. The app learns from past conversations, adapts to each contact's communication style, and maintains persistent context about contacts and the user.

## Core Features

### 1. Message Suggestion Generation
- Generate 2-3 response options for incoming messages
- Responses tailored to the specific contact and conversation context
- Copy-to-clipboard functionality for easy use in iMessage

### 2. Conversation History Analysis
- Automatic import from iMessage database (`~/Library/Messages/chat.db`)
- Parse message history per contact
- Analyze conversation patterns and formality levels
- Track emoji usage, message length, and tone

### 3. Style Matching & Auto-Classification
- Analyze each contact's communication style:
  - Formality level (casual vs professional)
  - Message length preferences
  - Emoji and punctuation usage
  - Response time patterns
  - Common phrases and language patterns
- **Auto-discover distinguishing properties across all contacts:**
  - Run ML analysis to identify which dimensions best separate contacts
  - Automatically suggest categories (e.g., personal vs work, close friends vs acquaintances)
  - Cluster contacts based on communication patterns
  - Present findings: "Your contacts split mainly on: formality (work/personal), message frequency, and emoji usage"
- Match response style to contact's typical communication

### 4. Contact Context Management
- Chat-like interface to add/edit information about each contact
- Persistent storage of:
  - Relationship type (friend, colleague, family, etc.)
  - Background information
  - Shared history
  - Topics discussed
  - Preferences and interests
- Quick context editing while viewing conversation

### 5. User State Management
- Store current user context:
  - Current location and travel plans
  - Work schedule and availability
  - Recent activities and events
  - Personal status updates
- Use this context when generating responses
- Example: "I'm in Boston next week" → auto-decline NYC hangout invites

### 6. Intelligent Context Usage
- Combine multiple context sources:
  - Message history with this contact
  - Contact background information
  - User's current state
  - Recent conversations with other contacts (when relevant)
- Smart context retrieval based on conversation topic

## Technical Architecture

### Platform
- **Web Application** (Next.js + React + TypeScript)
- Runs locally at http://localhost:3000
- Requires macOS 10.14+ for iMessage database access (server-side)

### Tech Stack
- **Frontend**: Next.js 14+ with App Router + React + TypeScript
- **Backend**: Next.js API Routes (Node.js server)
- **UI Library**: Tailwind CSS + shadcn/ui components
- **Local Database**: SQLite (for context storage)
- **iMessage Access**: better-sqlite3 (Node.js library to read chat.db)
- **AI Provider**: OpenAI GPT-4 API
- **State Management**: React Context + hooks / Zustand

### Database Schema

#### Contacts Table
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  phone_number TEXT UNIQUE,
  name TEXT,
  relationship_type TEXT,
  formality_level TEXT, -- casual, neutral, formal
  communication_style JSON, -- {emoji_frequency, avg_message_length, etc}
  background_context TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### User Context Table
```sql
CREATE TABLE user_context (
  id INTEGER PRIMARY KEY,
  context_type TEXT, -- location, availability, event, etc
  content TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP
);
```

#### Context History Table
```sql
CREATE TABLE context_history (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER,
  context_text TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);
```

#### Message Cache Table
```sql
CREATE TABLE message_cache (
  id INTEGER PRIMARY KEY,
  contact_id INTEGER,
  message_text TEXT,
  is_from_me BOOLEAN,
  timestamp TIMESTAMP,
  imessage_id TEXT UNIQUE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);
```

## User Flow

### Initial Setup
1. Grant app Full Disk Access permission (for chat.db)
2. Import iMessage contacts
3. App analyzes existing message history
4. User adds initial context about key contacts

### Daily Usage
1. User receives iMessage
2. Opens iMessage Assistant app
3. Selects the conversation/contact
4. App displays:
   - Recent message history
   - Contact context summary
   - 2-3 AI-generated response suggestions
5. User can:
   - Copy a suggestion to clipboard
   - Regenerate with different tone
   - Add/edit contact context
   - Update their own status/context
6. User pastes response into iMessage

### Context Management
1. Click contact name to view/edit context
2. Chat interface to add notes about the person
3. Context automatically saved and timestamped
4. Update personal context via dedicated panel
5. Set time-based context (e.g., "In Boston Dec 1-5")

## AI Prompt Strategy

### Style Analysis Prompt
```
Analyze the following message history and determine:
1. Formality level (1-10 scale)
2. Average message length
3. Emoji usage frequency
4. Tone (friendly, professional, enthusiastic, etc.)
5. Common phrases or patterns
```

### Response Generation Prompt
```
You are helping draft a response to [Contact Name].

CONTACT CONTEXT:
{contact_background}

CONVERSATION STYLE:
{style_profile}

YOUR CURRENT STATUS:
{user_context}

RECENT MESSAGES:
{message_history}

Generate 3 response options that:
1. Match this person's communication style
2. Use relevant context from their background
3. Consider my current status and availability
4. Sound natural and authentic to how I communicate
```

## Security & Privacy

### Data Storage
- All data stored locally on user's Mac
- SQLite database encrypted at rest
- OpenAI API calls don't store message data (use zero-retention)

### Permissions Required
- Full Disk Access (to read ~/Library/Messages/chat.db)
- Internet access (for OpenAI API)

### Privacy Considerations
- iMessage database is read-only (never modified)
- No cloud storage of messages or context
- API key stored in encrypted keychain
- User can delete all local context data anytime

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Electron + React + TypeScript
- [ ] iMessage database reader implementation
- [ ] Local SQLite database setup
- [ ] Basic UI layout

### Phase 2: Core Features (Week 3-4)
- [ ] Contact list and conversation viewer
- [ ] OpenAI API integration
- [ ] Basic message suggestion generation
- [ ] Copy-to-clipboard functionality

### Phase 3: Context System (Week 5-6)
- [ ] Contact context management interface
- [ ] User context/status management
- [ ] Context storage and retrieval
- [ ] Integration with AI prompts

### Phase 4: Style Matching (Week 7-8)
- [ ] Conversation style analysis engine
- [ ] Style profile generation per contact
- [ ] Tone/formality matching in responses
- [ ] Refinement of AI prompts

### Phase 5: Polish & Testing (Week 9-10)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] User testing and feedback
- [ ] Documentation

## Success Metrics
- Response suggestions match contact's style 80%+ of the time
- User copies suggested response 60%+ of the time
- Context system reduces repetitive context-giving
- App generates responses in <5 seconds

## Future Enhancements
- Send messages directly from app (via AppleScript)
- Smart notifications for important messages
- Multi-language support
- Calendar integration for availability
- Contact grouping and templates
- Analytics on communication patterns
- Browser extension for web-based messaging

## Estimated Timeline
**10 weeks** for full MVP with all features

## Dependencies
- macOS 10.14+
- Node.js 18+
- OpenAI API key
- ~500MB disk space

## Estimated Costs
- OpenAI API: ~$10-30/month (depending on usage)
- Development tools: Free (using open-source stack)
