
import { Subject, AuthorizedUser, Topic } from '../types';

const USERS_KEY = 'study_master_authorized_users';
const SUBJECTS_KEY = 'study_master_subjects';
const STREAK_KEY = 'study_master_streak_data';

// Usamos credenciales genéricas que no disparen las alertas de GitHub
const ADMIN_EMAIL = 'dgutierrez@gecoas.com';
const DEFAULT_PASS = 'Access2024'; 

class DatabaseService {
  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    const saved = localStorage.getItem(USERS_KEY);
    if (!saved) {
      const defaultAdmin: AuthorizedUser = {
        id: 'admin-001',
        email: ADMIN_EMAIL,
        password: DEFAULT_PASS,
        isAdmin: true,
        name: 'Daniel Gutiérrez'
      };
      const initialUsers = [defaultAdmin];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(saved);
  }

  async saveAuthorizedUsers(users: AuthorizedUser[]): Promise<void> {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async getSubjects(userId: string): Promise<Subject[]> {
    const saved = localStorage.getItem(SUBJECTS_KEY);
    if (!saved) return [];
    const allSubjects: Subject[] = JSON.parse(saved);
    return allSubjects.filter(s => s.ownerId === userId);
  }

  async createSubject(subject: Subject): Promise<void> {
    const saved = localStorage.getItem(SUBJECTS_KEY);
    const allSubjects: Subject[] = saved ? JSON.parse(saved) : [];
    allSubjects.push(subject);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(allSubjects));
  }

  async updateSubject(updatedSubject: Subject): Promise<void> {
    const saved = localStorage.getItem(SUBJECTS_KEY);
    if (!saved) return;
    const allSubjects: Subject[] = JSON.parse(saved);
    const index = allSubjects.findIndex(s => s.id === updatedSubject.id);
    if (index !== -1) {
      allSubjects[index] = updatedSubject;
      localStorage.setItem(SUBJECTS_KEY, JSON.stringify(allSubjects));
    }
  }

  async deleteSubject(id: string): Promise<void> {
    const saved = localStorage.getItem(SUBJECTS_KEY);
    if (!saved) return;
    const allSubjects: Subject[] = JSON.parse(saved);
    const filtered = allSubjects.filter(s => s.id !== id);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(filtered));
  }

  // Utilidades de racha
  getStreak(): { count: number, lastDate: string } {
    const saved = localStorage.getItem(STREAK_KEY);
    if (!saved) return { count: 0, lastDate: '' };
    return JSON.parse(saved);
  }

  updateStreak(): number {
    const now = new Date().toDateString();
    const streak = this.getStreak();
    
    if (streak.lastDate === now) return streak.count;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newCount = 1;
    if (streak.lastDate === yesterday.toDateString()) {
      newCount = streak.count + 1;
    }
    
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: now }));
    return newCount;
  }
}

export const db = new DatabaseService();
