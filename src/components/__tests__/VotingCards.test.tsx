import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVotingStore } from '@/store/useVotingStore';
import { CARD_VALUES } from '@/types';
import VotingCards from '../VotingCards';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;
const mockCastVote = jest.fn();

function setupStore({
  currentUserVote = null as string | null,
  isRevealed = false,
} = {}) {
  const state = { castVote: mockCastVote, currentUserVote, isRevealed };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(state),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

describe('VotingCards — rendering', () => {
  it('renders a button for every card value', () => {
    render(<VotingCards />);
    for (const value of CARD_VALUES) {
      const label = value === '?' ? 'Vote unsure' : `Vote ${value} points`;
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('has aria-pressed false for unselected cards', () => {
    render(<VotingCards />);
    const btn = screen.getByRole('button', { name: 'Vote 3 points' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed true for the selected card', () => {
    setupStore({ currentUserVote: '5' });
    render(<VotingCards />);
    expect(
      screen.getByRole('button', { name: 'Vote 5 points' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Vote 3 points' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the fieldset with a screen-reader legend', () => {
    render(<VotingCards />);
    expect(
      screen.getByRole('group', { name: 'Vote cards' }),
    ).toBeInTheDocument();
  });
});

describe('VotingCards — interactions', () => {
  it('calls castVote with the card value when clicked', async () => {
    render(<VotingCards />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Vote 8 points' }),
    );
    expect(mockCastVote).toHaveBeenCalledWith('8');
  });

  it('calls castVote with "?" when unsure card is clicked', async () => {
    render(<VotingCards />);
    await userEvent.click(screen.getByRole('button', { name: 'Vote unsure' }));
    expect(mockCastVote).toHaveBeenCalledWith('?');
  });
});

describe('VotingCards — disabled state', () => {
  it('disables all cards when isRevealed is true', () => {
    setupStore({ isRevealed: true });
    render(<VotingCards />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
  });

  it('does not call castVote when clicking a disabled card', () => {
    setupStore({ isRevealed: true });
    render(<VotingCards />);
    fireEvent.click(screen.getByRole('button', { name: 'Vote 3 points' }));
    expect(mockCastVote).not.toHaveBeenCalled();
  });
});

describe('VotingCards — keyboard navigation', () => {
  it('moves focus to next card on ArrowRight', () => {
    render(<VotingCards />);
    const firstBtn = screen.getByRole('button', {
      name: `Vote ${CARD_VALUES[0]} points`,
    });
    act(() => {
      firstBtn.focus();
    });
    act(() => {
      fireEvent.keyDown(firstBtn, { key: 'ArrowRight' });
    });
    const secondLabel =
      CARD_VALUES[1] === '?' ? 'Vote unsure' : `Vote ${CARD_VALUES[1]} points`;
    expect(screen.getByRole('button', { name: secondLabel })).toHaveFocus();
  });

  it('moves focus to previous card on ArrowLeft', () => {
    render(<VotingCards />);
    const buttons = screen.getAllByRole('button');
    act(() => {
      buttons[1].focus();
    });
    act(() => {
      fireEvent.keyDown(buttons[1], { key: 'ArrowLeft' });
    });
    expect(buttons[0]).toHaveFocus();
  });

  it('wraps around to last card when pressing ArrowLeft on first', () => {
    render(<VotingCards />);
    const firstBtn = screen.getByRole('button', {
      name: `Vote ${CARD_VALUES[0]} points`,
    });
    act(() => {
      firstBtn.focus();
    });
    act(() => {
      fireEvent.keyDown(firstBtn, { key: 'ArrowLeft' });
    });
    const lastLabel =
      CARD_VALUES[CARD_VALUES.length - 1] === '?'
        ? 'Vote unsure'
        : `Vote ${CARD_VALUES[CARD_VALUES.length - 1]} points`;
    expect(screen.getByRole('button', { name: lastLabel })).toHaveFocus();
  });

  it('wraps around to first card when pressing ArrowRight on last', () => {
    render(<VotingCards />);
    const lastLabel =
      CARD_VALUES[CARD_VALUES.length - 1] === '?'
        ? 'Vote unsure'
        : `Vote ${CARD_VALUES[CARD_VALUES.length - 1]} points`;
    const lastBtn = screen.getByRole('button', { name: lastLabel });
    act(() => {
      lastBtn.focus();
    });
    act(() => {
      fireEvent.keyDown(lastBtn, { key: 'ArrowRight' });
    });
    expect(
      screen.getByRole('button', { name: `Vote ${CARD_VALUES[0]} points` }),
    ).toHaveFocus();
  });
});
