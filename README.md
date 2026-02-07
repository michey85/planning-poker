## Planning Poker App

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
- 