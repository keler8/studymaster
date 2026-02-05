import { Subject, AuthorizedUser } from '../types';

const STREAK_KEY = 'study_master_streak_data';

// Defaults kept client-side for convenience; the server also seeds an admin.
const ADMIN_EMAIL = 'dgutierrez@gecoas.com';
const DEFAULT_PASS = 'Access2024';

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }
  // 204 no content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

class DatabaseService {
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    try {
      const users = await api<AuthorizedUser[]>('/api/users');
      // Ensure there is always at least one admin client-side fallback
      if (!users?.length) {
        return [{
          id: 'admin-001',
          email: ADMIN_EMAIL,
          password: DEFAULT_PASS,
          isAdmin: true,
          name: 'Daniel Gutiérrez'
        }];
      }
      return users;
    } catch (e) {
      // Offline/dev fallback: keep previous behavior
      return [{
        id: 'admin-001',
        email: ADMIN_EMAIL,
        password: DEFAULT_PASS,
        isAdmin: true,
        name: 'Daniel Gutiérrez'
      }];
    }
  }

  async saveAuthorizedUsers(users: AuthorizedUser[]): Promise<void> {
    await api<{ ok: boolean }>('/api/users', {
      method: 'PUT',
      body: JSON.stringify(users),
    });
  }

  async getSubjects(userId: string): Promise<Subject[]> {
    return api<Subject[]>(`/api/subjects?ownerId=${encodeURIComponent(userId)}`);
  }

  async createSubject(subject: Subject): Promise<void> {
    await api<{ ok: boolean }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  }

  async updateSubject(updatedSubject: Subject): Promise<void> {
    await api<{ ok: boolean }>(`/api/subjects/${encodeURIComponent(updatedSubject.id)}`, {
      method: 'PUT',
      body: JSON.stringify(updatedSubject),
    });
  }

  async deleteSubject(id: string): Promise<void> {
    await api<{ ok: boolean }>(`/api/subjects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Streak remains local (per-device). If you want it global, we can move it server-side too.
  getStreak(): { count: number, lastDate: string } {
    const saved = localStorage.getItem(STREAK_KEY);
    if (!saved) return { count: 0, lastDate: '' };
    return JSON.parse(saved);
  }

  updateStreak(): number {
    const now = new Date().toDateString();
    const streak = this.getStreak();

    if (streak.lastDate !== now) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const wasYesterday = streak.lastDate === yesterday.toDateString();
      const newCount = wasYesterday ? streak.count + 1 : 1;

      const newStreak = { count: newCount, lastDate: now };
      localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      return newCount;
    }

    return streak.count;
  }
}

export const databaseService = new DatabaseService();
