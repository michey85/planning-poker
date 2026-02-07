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

export const CARD_VALUES: CardValue[] = [
  '1',
  '2',
  '3',
  '5',
  '8',
  '13',
  '21',
  '?',
];
