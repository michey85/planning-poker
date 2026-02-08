const STORAGE_KEY = 'pp:session-users';

type SessionUserMap = Record<string, string>;

function getMap(): SessionUserMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setMap(map: SessionUserMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function getStoredUserName(sessionId: string): string | null {
  return getMap()[sessionId] ?? null;
}

export function setStoredUserName(sessionId: string, userName: string): void {
  const map = getMap();
  map[sessionId] = userName;
  setMap(map);
}

export function removeStoredUserName(sessionId: string): void {
  const map = getMap();
  delete map[sessionId];
  setMap(map);
}
