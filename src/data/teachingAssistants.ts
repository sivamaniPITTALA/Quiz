import { TeachingAssistant } from '../types';

export const DEFAULT_TEACHING_ASSISTANTS: TeachingAssistant[] = [
  {
    id: 'TA-01',
    name: 'Sivamani',
    rollNo: '25MCMT39',
    email: 'sivamani@univ.edu',
    department: 'Teaching Assistant',
    avatar: '👨‍🏫',
    accessCode: 'TADC2026',
  },
  {
    id: 'TA-02',
    name: 'Nikitha',
    rollNo: '', // User will add roll number
    email: 'nikitha@univ.edu',
    department: 'Teaching Assistant',
    avatar: '👩‍🏫',
    accessCode: 'TADC2026',
  },
  {
    id: 'TA-03',
    name: 'Madhumathi',
    rollNo: '', // User will add roll number
    email: 'madhumathi@univ.edu',
    department: 'Teaching Assistant',
    avatar: '👩‍🏫',
    accessCode: 'TADC2026',
  },
];

const ROSTER_STORAGE_KEY = 'authorized_teaching_assistants_roster_v3';
const SESSION_STORAGE_KEY = 'active_teaching_assistant_session';

export function getAuthorizedTeachingAssistants(): TeachingAssistant[] {
  try {
    const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!raw) return DEFAULT_TEACHING_ASSISTANTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all have accessCode TADC2026
      return parsed.map((item) => ({ ...item, accessCode: 'TADC2026' }));
    }
    return DEFAULT_TEACHING_ASSISTANTS;
  } catch {
    return DEFAULT_TEACHING_ASSISTANTS;
  }
}

export function saveAuthorizedTeachingAssistants(list: TeachingAssistant[]): void {
  try {
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save TA roster:', err);
  }
}

export function updateTeachingAssistantRollNo(id: string, newRollNo: string): TeachingAssistant[] {
  const currentList = getAuthorizedTeachingAssistants();
  const updated = currentList.map((ta) => {
    if (ta.id === id) {
      return { ...ta, rollNo: newRollNo.trim().toUpperCase() };
    }
    return ta;
  });
  saveAuthorizedTeachingAssistants(updated);

  // If active session matches this TA, update active session too
  const activeSession = getActiveTeachingAssistant();
  if (activeSession && activeSession.id === id) {
    setActiveTeachingAssistant({ ...activeSession, rollNo: newRollNo.trim().toUpperCase() });
  }

  return updated;
}

export const AUTHORIZED_TEACHING_ASSISTANTS: TeachingAssistant[] = DEFAULT_TEACHING_ASSISTANTS;

export function getActiveTeachingAssistant(): TeachingAssistant | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const roster = getAuthorizedTeachingAssistants();
    const found = roster.find((ta) => ta.id === parsed.id || ta.name.toLowerCase() === parsed.name?.toLowerCase());
    return found || parsed || null;
  } catch {
    return null;
  }
}

export function setActiveTeachingAssistant(ta: TeachingAssistant): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ta));
  } catch (err) {
    console.error('Failed to store TA session', err);
  }
}

export function clearActiveTeachingAssistant(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear TA session', err);
  }
}

export function verifyTeachingAssistant(identifier: string, code: string): TeachingAssistant | null {
  const cleanId = identifier.trim().toUpperCase();
  const cleanCode = code.trim();

  // Strict passcode requirement: TADC2026
  if (cleanCode !== 'TADC2026') {
    return null;
  }

  const roster = getAuthorizedTeachingAssistants();

  const ta = roster.find((item) => {
    const itemRoll = (item.rollNo || '').trim().toUpperCase();
    const itemName = item.name.trim().toUpperCase();
    const itemId = item.id.toUpperCase();

    // Match by exact or partial Name (e.g. Sivamani, Nikitha, Madhumathi)
    if (itemName === cleanId || cleanId.includes(itemName) || itemName.includes(cleanId)) return true;

    // Match by Roll No (if defined, e.g. 25MCMT39)
    if (itemRoll && itemRoll === cleanId) return true;

    // Match by ID (TA-01, TA-02, TA-03)
    if (itemId === cleanId) return true;

    return false;
  });

  return ta || null;
}
