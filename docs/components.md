# Components

All components are in `src/components/`. Every component below is a client component (`'use client'`).

## Component Tree

```
layout.tsx
├── ToastContainer          # Global toast notifications
└── page.tsx (home)
    ├── CreateSessionForm   # Task name input → create session → redirect
    └── JoinSessionForm     # Session ID input → join → redirect

session/[id]/page.tsx
└── SessionRoom             # Main session orchestrator
    ├── ConnectionAlert     # Real-time connection status banner
    ├── TaskHeader          # Task name display + session ID sharing
    ├── VotingCards         # Fibonacci card selection (1–21, ?)
    ├── ModeratorControls   # Reveal / New Round / Close Session buttons
    ├── VotingResults       # Average, median, consensus level, flip cards
    ├── ParticipantsList    # All participants with vote status indicators
    ├── RoundHistory        # Past rounds with task names and consensus values
    └── UsernamePrompt      # Modal for entering username on first visit
```

## Component Responsibilities

### `SessionRoom`
Entry point for the session page. Handles session loading, error states, username gating, and session-closed state. Composes all sub-components.

### `VotingCards`
Renders Fibonacci cards (`CARD_VALUES`). Highlights the selected card. Disabled after voting when cards aren't revealed. Allows re-voting before reveal.

### `ModeratorControls`
Visible only to the moderator (first joiner). Shows:
- **Before reveal**: "Reveal Cards" button (pulses when all have voted)
- **After reveal**: "New Round" form with task name input and consensus value picker
- **Always**: "Close Session" button with confirmation dialog

### `VotingResults`
Shown only when `isRevealed = true`. Displays:
- Average and median (excluding `?` votes)
- Consensus badge: "Consensus!" (green), "Close" (amber), or "Divergent" (red)
- Flip-card animation revealing each participant's vote

### `ParticipantsList`
Lists all participants from the `votes` array. Shows a checkmark for users who have voted. Hides actual vote values until reveal.

### `RoundHistory`
Displays past rounds with round number, task name, and consensus value.

### `TaskHeader`
Shows the current task name and a copyable session ID/link for sharing.

### `UsernamePrompt`
Rendered when `userName` is null. Input form to set the display name. Also supports renaming.

### `ConnectionAlert`
Banner shown when real-time connection status is `'connecting'` or `'error'`.

### `ToastContainer`
Global component in the root layout. Renders toast notifications pushed via `pushToast()` from `src/lib/toast.ts`.
