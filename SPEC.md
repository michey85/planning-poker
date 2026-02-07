# Planning Poker Web Application - Technical Specification

## Project Overview

A real-time Planning Poker web application for educational content demonstration. The app allows teams to estimate tasks collaboratively using the Scrum Planning Poker technique with Fibonacci sequence cards.

**Purpose**: Educational content for YouTube/courses demonstrating real-time web applications with React, TypeScript, and Supabase.

**Scope**: Minimum Viable Product (MVP) with core voting functionality.

## Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+
- **State Management**: Zustand 5+
- **Styling**: Tailwind CSS 4+

### Backend & Real-time
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (WebSocket)
- **Authentication**: None (anonymous users with usernames)

### Development Tools
- **Package Manager**: npm
- **Linting**: Biome
- **Formatting**: Biome
- **Deployment**: Vercel

## Architecture Overview
```
┌─────────────┐
│   Next.js   │
│   Frontend  │
└──────┬──────┘
       │
       │ HTTP + WebSocket
       │
┌──────▼──────────┐
│    Supabase     │
│  ┌───────────┐  │
│  │ PostgreSQL│  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │ Realtime  │  │
│  └───────────┘  │
└─────────────────┘
```

## Database Schema

### Table: `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (read, insert, update)
CREATE POLICY "Enable all access for sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);
```

### Table: `votes`
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  value TEXT,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_per_session UNIQUE(session_id, user_name)
);

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Enable all access for votes" ON votes
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_votes_session_id ON votes(session_id);
```

## TypeScript Types
```typescript
// types/index.ts

export interface Session {
  id: string;
  task_name: string;
  is_revealed: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  user_name: string;
  value: string | null;
  voted_at: string;
}

export type CardValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?';

export const CARD_VALUES: CardValue[] = ['1', '2', '3', '5', '8', '13', '21', '?'];
```

## Zustand Store Structure
```typescript
// store/useVotingStore.ts

interface VotingState {
  // Session data
  sessionId: string | null;
  taskName: string | null;
  isRevealed: boolean;
  
  // User data
  userName: string | null;
  currentUserVote: string | null;
  
  // Votes data
  votes: Vote[];
  
  // Actions
  setUserName: (name: string) => void;
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;
  setVotes: (votes: Vote[]) => void;
  addVote: (vote: Vote) => void;
  updateVote: (vote: Vote) => void;
  removeVote: (voteId: string) => void;
  castVote: (value: string) => void;
  reset: () => void;
}
```

## Functional Requirements

### 1. Home Page (`/`)
- Display app title and description
- **Create Session** form:
  - Input: Task name (required)
  - Button: "Create Session"
  - Action: Create new session in DB, redirect to `/session/[id]`
- **Join Session** form:
  - Input: Session ID (UUID or short code)
  - Button: "Join Session"
  - Action: Validate session exists, redirect to `/session/[id]`

### 2. Session Page (`/session/[id]`)

#### On Load:
- Prompt for username if not set (modal or inline form)
- Fetch session data from Supabase
- Subscribe to real-time updates for votes
- Insert/update vote record with `value: null` (join session)

#### Display Components:

**Task Header**
- Show task name prominently
- Show session ID for sharing

**Participants List**
- Display all users who joined (from votes table)
- Show checkmark/indicator for users who voted
- Hide vote values until revealed

**Card Selection**
- Display Fibonacci cards: 1, 2, 3, 5, 8, 13, 21, ?
- Highlight selected card
- Disable selection after voting
- Enable re-voting before reveal

**Voting Status**
- Show "X out of Y voted" counter
- Show progress indicator

**Control Buttons**
- **Reveal Cards** button:
  - Visible to all users (or only first user = moderator)
  - Updates `sessions.is_revealed = true`
  - Triggers reveal animation
- **New Round** button:
  - Visible after reveal
  - Clears all votes from DB
  - Sets `is_revealed = false`
  - Optionally updates task name

**Results Display** (after reveal)
- Show each participant's vote as a card
- Calculate and display:
  - Average (excluding "?" votes)
  - Median (excluding "?" votes)
- Visual indication of consensus/divergence

### 3. Real-time Synchronization

**Supabase Realtime Subscriptions**:
- Subscribe to `votes` table filtered by `session_id`
- Handle events:
  - `INSERT`: New user joined
  - `UPDATE`: User voted or changed vote
  - `DELETE`: User left or round reset
- Subscribe to `sessions` table for reveal status changes

**State Updates**:
- Update Zustand store on every real-time event
- Implement optimistic updates for user's own votes

## User Flows

### Flow 1: Create and Host Session
1. User visits home page
2. Enters task name, clicks "Create Session"
3. Redirected to `/session/[id]`
4. Prompted for username
5. Sees empty participants list
6. Waits for others to join
7. Selects card and votes
8. Clicks "Reveal Cards" when ready
9. Views results
10. Clicks "New Round" to reset

### Flow 2: Join Existing Session
1. User receives session link from host
2. Visits `/session/[id]`
3. Prompted for username
4. Sees existing participants and voting status
5. Selects card and votes
6. Waits for reveal
7. Views results
8. Continues to next round

## Non-Functional Requirements

### Performance
- Initial page load: < 2s
- Real-time update latency: < 500ms
- Support up to 20 concurrent users per session

### Usability
- Mobile-responsive design (mobile-first)
- Keyboard navigation support
- Clear visual feedback for all actions
- Error messages for invalid states

### Security
- No authentication required (public sessions)
- Row Level Security (RLS) enabled on Supabase
- Input validation for usernames and task names
- UUID-based session IDs (hard to guess)

## Project Structure
```
planning-poker/
├── app/
│   ├── page.tsx                    # Home page
│   ├── session/
│   │   └── [id]/
│   │       └── page.tsx            # Session page
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/
│   ├── CreateSessionForm.tsx
│   ├── JoinSessionForm.tsx
│   ├── UsernamePrompt.tsx
│   ├── VotingCard.tsx
│   ├── ParticipantsList.tsx
│   ├── VotingResults.tsx
│   └── ControlButtons.tsx
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── utils.ts                    # Utility functions
├── store/
│   └── useVotingStore.ts           # Zustand store
├── types/
│   └── index.ts                    # TypeScript types
├── hooks/
│   ├── useRealtimeVotes.ts         # Real-time subscription hook
│   └── useSession.ts               # Session data hook
├── .env.local                      # Environment variables
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Implementation Phases

### Phase 1: Project Setup
- Initialize Next.js project with TypeScript
- Install dependencies
- Configure Tailwind CSS
- Create basic layout and routing

### Phase 2: Supabase Setup
- Create Supabase project
- Run database migrations
- Configure RLS policies
- Set up Supabase client

### Phase 3: State Management
- Implement Zustand store
- Create TypeScript types
- Build utility functions

### Phase 4: Home Page
- Create session form
- Join session form
- Basic validation

### Phase 5: Session Page - UI
- Username prompt
- Card selection UI
- Participants list
- Control buttons

### Phase 6: Real-time Integration
- Implement Supabase Realtime subscriptions
- Handle vote updates
- Sync session state

### Phase 7: Voting Logic
- Vote casting functionality
- Reveal mechanism
- Results calculation
- New round functionality

### Phase 8: Polish
- Error handling
- Loading states
- Animations
- Mobile responsiveness
- URL sharing functionality

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy (automatic on push to main)

### Supabase Configuration
- Ensure RLS policies are properly configured
- Verify Realtime is enabled for tables
- Check connection limits for free tier

## Success Criteria

- [ ] Users can create sessions with task names
- [ ] Users can join sessions via unique URLs
- [ ] Users can vote using Fibonacci cards
- [ ] All users see real-time updates of votes
- [ ] Moderator can reveal all votes
- [ ] Results show average and median
- [ ] Users can start new rounds
- [ ] Application is mobile-responsive
- [ ] Application is deployed and publicly accessible

## Known Limitations (MVP)

- No persistent user authentication
- No session history or analytics
- No custom card decks
- No timer for voting rounds
- No session moderation/admin role enforcement
- No voting history per session
- Session cleanup not automated (manual DB cleanup needed)

## Future Enhancements (Post-MVP)

- User authentication with Supabase Auth
- Session history and statistics
- Custom card decks
- Voting timer
- Export results (PDF/CSV)
- Session ownership and moderation
- Multiple estimation rounds per session
- Integration with Jira/Linear

---

**Target Completion**: 8-12 hours of development time for MVP

**Educational Focus**: Demonstrate real-time application development, state management with Zustand, and Supabase integration in Next.js.
