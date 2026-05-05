# Unit Tests — Components

## Stack

- **Jest** with `jsdom` test environment
- **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`)
- **`@testing-library/jest-dom`** matchers (configured in `jest.setup.ts`)

## Conventions

### Queries — prefer semantic selectors

```ts
screen.getByRole('button', { name: 'Submit' })  // ✅
screen.getByLabelText('Task Name')               // ✅
screen.getByText('Error message')                // ✅
screen.getByTestId('...')                        // ❌ last resort
```

### User interactions

Use `userEvent` (async) for realistic interaction. Fall back to `fireEvent` (sync) only when `jest.useFakeTimers()` is active — `userEvent` has internal timer conflicts with fake timers.

```ts
await userEvent.type(input, 'text');
await userEvent.click(button);

// With fake timers:
fireEvent.click(button);
act(() => jest.advanceTimersByTime(2000));
```

### Async assertions — always use `waitFor`

```ts
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```

### `beforeEach` — always clear mocks

```ts
beforeEach(() => jest.clearAllMocks());
```

## Mocking Patterns

### `next/navigation`

```ts
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

### Database / lib functions

```ts
jest.mock('@/lib/database', () => ({ createSession: jest.fn() }));
const mockFn = createSession as jest.MockedFunction<typeof createSession>;
```

### Zustand store

Mock at the selector level so individual tests control returned state:

```ts
jest.mock('@/store/useVotingStore');
mockUseVotingStore.mockImplementation((selector) => selector(stateShape));
```

### Supabase client

```ts
jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
```

## What to Test

Each component file covers:

1. **Rendering** — required elements exist in the DOM
2. **Validation** — invalid input paths show correct error messages
3. **Happy path** — successful flow triggers navigation / side effects
4. **Edge cases** — empty input, whitespace trimming, boundary values
5. **Loading state** — buttons/inputs disable during async work
6. **Error recovery** — UI recovers (re-enables, shows message) after failures
7. **Timer behaviour** — if a component uses `setTimeout`, test reset with fake timers

## File Naming

`ComponentName.test.tsx` — co-located in this `__tests__` directory alongside the component source at `../ComponentName.tsx`.
