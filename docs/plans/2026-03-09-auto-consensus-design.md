# Auto-Consensus Pre-selection Design

**Date:** 2026-03-09
**Feature:** Auto-select consensus value when all votes are unanimous

## Overview

When the moderator clicks "New Round" and all votes are identical (perfect consensus), the consensus card picker should automatically pre-select that value. The moderator can still override it before clicking "Start Round."

## Change

Single file: `src/components/ModeratorControls.tsx`

Update `handleNewRound` to compute whether all non-null votes share the same value. If so, pre-initialize `consensusValue` with that value; otherwise leave it `null` (current behavior).

```typescript
const handleNewRound = () => {
  setNewTaskName(taskName ?? '');
  const values = votes.map((v) => v.value).filter((v) => v !== null);
  const unanimous = values.length > 0 && values.every((v) => v === values[0]);
  setConsensusValue(unanimous ? values[0] : null);
  setShowNewRound(true);
};
```

No store changes, no new selectors, no other files touched.
