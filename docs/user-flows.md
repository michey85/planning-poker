# User Flows

## Flow 1: Create and Host a Session

1. Visit `/` (home page)
2. Enter task name in "Create Session" form
3. Click "Create Session" → session created in DB
4. Redirected to `/session/[id]`
5. Prompted for username → enters name
6. Username saved to localStorage + null-vote inserted (joins session)
7. Share session URL/ID with team
8. Wait for participants to join
9. Select a Fibonacci card to vote
10. When all have voted → "Reveal Cards" button pulses
11. Click "Reveal Cards" → votes shown with flip animation
12. View results: average, median, consensus level
13. Click "New Round" → pick consensus value, optionally change task name
14. Click "Start Round" → round saved to history, all votes reset
15. Repeat from step 9
16. Optionally click "Close Session" → confirmation → session deleted, all participants see closure message

## Flow 2: Join an Existing Session

1. Receive session link or ID from host
2. Visit `/session/[id]` (or paste ID on home page and click "Join")
3. Prompted for username → enters name
4. See current participants and voting status
5. Select a card to vote
6. Wait for moderator to reveal
7. View results after reveal
8. Wait for next round
9. Continue voting in subsequent rounds

## Flow 3: Reconnect to a Session

1. Close browser tab during an active session
2. Revisit `/session/[id]`
3. Username is auto-restored from localStorage
4. Previous vote is restored from DB
5. Session continues seamlessly — no re-prompting

## Moderator Determination

The moderator is the participant with the earliest `voted_at` timestamp — effectively the first person to join. Only the moderator sees:
- "Reveal Cards" button
- "New Round" controls
- "Close Session" button

Other participants see status messages ("Waiting for moderator to reveal...", "Waiting for next round...").

## Card Values

Fibonacci sequence: `1, 2, 3, 5, 8, 13, 21, ?`

- Numeric values (1–21) represent relative complexity/effort
- `?` indicates uncertainty — excluded from average/median calculations

## Consensus Levels (after reveal)

| Level | Condition | Badge Color |
|-------|-----------|-------------|
| Consensus! | All numeric votes are the same value | Green |
| Close | Spread ≤ 2 positions in the Fibonacci sequence | Amber |
| Divergent | Spread > 2 positions | Red |

## Auto-Consensus

When all participants vote the same value (unanimous), the consensus value is automatically pre-selected in the "New Round" form.
