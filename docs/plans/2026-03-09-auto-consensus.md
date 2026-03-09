# Auto-Consensus Pre-selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When all votes are unanimous, automatically pre-select that value in the consensus card picker when the moderator clicks "New Round."

**Architecture:** Single change to `handleNewRound` in `ModeratorControls.tsx` — before showing the new round form, check if all non-null votes share the same value and pre-initialize `consensusValue` state with it. The card picker remains editable so the moderator can override.

**Tech Stack:** React 19, TypeScript, Zustand 5, Biome

---

### Task 1: Auto-select consensus value in ModeratorControls

**Files:**
- Modify: `src/components/ModeratorControls.tsx`

**Step 1: Read the file**

Read `src/components/ModeratorControls.tsx` to locate `handleNewRound` (currently around line 45).

Current implementation:
```typescript
const handleNewRound = () => {
  setNewTaskName(taskName ?? '');
  setShowNewRound(true);
};
```

**Step 2: Replace `handleNewRound`** with:

```typescript
const handleNewRound = () => {
  setNewTaskName(taskName ?? '');
  const values = votes.map((v) => v.value).filter((v) => v !== null);
  const unanimous = values.length > 0 && values.every((v) => v === values[0]);
  setConsensusValue(unanimous ? values[0] : null);
  setShowNewRound(true);
};
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors in `src/components/ModeratorControls.tsx`.

**Step 4: Verify in browser**

Scenario A — perfect consensus:
1. Create a session, have all participants vote the same value (e.g., "5")
2. Reveal cards — confirm "Consensus!" badge appears
3. Click "New Round" — confirm the "5" card is already highlighted in the picker
4. Confirm "Start Round" is enabled immediately

Scenario B — divergent votes:
1. Have participants vote different values
2. Reveal cards
3. Click "New Round" — confirm no card is pre-selected (same as before)

**Step 5: Commit**

```bash
git add src/components/ModeratorControls.tsx
git commit -m "feat: auto-select consensus value when all votes are unanimous"
```
