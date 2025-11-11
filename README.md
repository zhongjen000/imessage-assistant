# iMessage Assistant

An intelligent web application that generates AI-powered message suggestions for iMessage conversations. Built with Next.js, tRPC, and OpenAI GPT-4.

## Features

- **Automatic iMessage Import**: Reads your iMessage history directly from macOS database
- **AI-Powered Suggestions**: Generate contextually-aware response suggestions using GPT-4
- **Style Matching**: Analyzes and matches each contact's communication style (formality, tone, emoji usage)
- **Contact Context Management**: Store background info about each contact for better suggestions
- **User State Management**: Track your current status (location, availability, etc.) for context-aware responses
- **Auto-Classification**: ML-powered analysis to automatically discover distinguishing properties between contacts

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Backend**: Next.js API Routes with tRPC for type-safe APIs
- **Database**: SQLite (for both iMessage reading and context storage)
- **AI**: OpenAI GPT-4
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query) + Zustand

## Prerequisites

- macOS 10.14+ (required for iMessage database access)
- Node.js 18+
- iMessage history on your Mac
- OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/imessage-assistant.git
cd imessage-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
IMESSAGE_DB_PATH=/Users/YOUR_USERNAME/Library/Messages/chat.db
CONTEXT_DB_PATH=./data/context.db
```

Replace `YOUR_USERNAME` with your actual macOS username.

### 4. Grant Full Disk Access

The app needs to read your iMessage database. Grant Full Disk Access:

1. Open **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Add your Terminal app or IDE (VS Code, etc.)
3. Restart your Terminal/IDE after granting access

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
imessage-assistant/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/trpc/        # tRPC API routes
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   ├── lib/
│   │   ├── db/              # Database utilities
│   │   │   ├── imessage.ts  # iMessage DB reader
│   │   │   └── context.ts   # Context DB manager
│   │   ├── trpc/            # tRPC client setup
│   │   └── utils.ts         # Utility functions
│   └── server/
│       ├── trpc.ts          # tRPC initialization
│       └── routers/         # tRPC routers
│           ├── _app.ts      # Root router
│           ├── contacts.ts  # Contact operations
│           ├── messages.ts  # Message operations
│           ├── userContext.ts  # User context
│           └── ai.ts        # AI suggestions
├── data/                    # Local databases (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Usage

1. **View Contacts**: All your iMessage contacts appear in the left sidebar
2. **Select Conversation**: Click a contact to view message history
3. **Get Suggestions**: Click "Generate Suggestions" to get AI-powered responses
4. **Add Context**: Use the context panel to add background info about contacts
5. **Update Your Status**: Set your current state (location, availability) in the user context panel

## Database Schema

### iMessage Database (Read-only)
- Located at `~/Library/Messages/chat.db`
- Contains your iMessage history
- Never modified by this app

### Context Database (Our data)
- **contacts**: Stores context about each contact
- **user_context**: Your current status and availability
- **context_history**: Conversation notes over time

## API Routes (tRPC)

### Contacts
- `contacts.getAll`: Get all contacts with context
- `contacts.search`: Search contacts by name/number
- `contacts.updateContext`: Update contact background info

### Messages
- `messages.getConversation`: Get message history with a contact
- `messages.getAllForContact`: Get all messages for analysis

### User Context
- `userContext.getAll`: Get your current context
- `userContext.add`: Add new context (e.g., "In Boston next week")
- `userContext.delete`: Remove context

### AI
- `ai.generateSuggestions`: Generate 3 response suggestions
- `ai.analyzeStyle`: Analyze contact's communication style

## Privacy & Security

- All data stored locally on your Mac
- iMessage database is read-only (never modified)
- OpenAI API uses zero-retention (messages not stored)
- No cloud storage or external data sharing
- Context database can be deleted anytime

## Development Roadmap

- [x] Project setup and architecture
- [x] iMessage database reader
- [x] tRPC API implementation
- [x] Basic UI with contact list
- [ ] Full conversation viewer UI
- [ ] AI suggestion generator UI
- [ ] Contact context management UI
- [ ] User context management UI
- [ ] Style analyzer with auto-classification
- [ ] Copy-to-clipboard functionality
- [ ] Search and filtering
- [ ] Dark mode
- [ ] Settings panel

## Troubleshooting

### "Failed to open iMessage database"
- Ensure Full Disk Access is granted to Terminal/IDE
- Restart Terminal/IDE after granting access
- Verify `IMESSAGE_DB_PATH` in `.env` is correct

### "No contacts found"
- Make sure you have iMessage history on this Mac
- Check that the database path is correct
- Verify Full Disk Access permissions

### "OpenAI API error"
- Check that `OPENAI_API_KEY` in `.env` is valid
- Ensure you have credits in your OpenAI account
- Check your internet connection

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI GPT-4](https://openai.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
