
import React, { useState, useEffect, useCallback } from 'react';
import { Subject, Topic, ViewState, User, QuizAttempt, AuthorizedUser } from './types';
import { db } from './services/databaseService';
import { formatLessonContent } from './services/geminiService';
import Dashboard from './components/Dashboard';
import SubjectView from './components/SubjectView';
import TopicView from './components/TopicView';
import Header from './components/Header';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ResultsPanel from './components/ResultsPanel';
import RetosView from './components/RetosView';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('study_master_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | undefined>(undefined);
  const [supervisedUser, setSupervisedUser] = useState<AuthorizedUser | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ type: currentUser ? 'dashboard' : 'login' });

  const activeViewingUserId = supervisedUser ? supervisedUser.id : (currentUser?.id || '');

  useEffect(() => {
    const loadAuth = async () => {
      setIsLoading(true);
      try {
        const users = await db.getAuthorizedUsers();
        setAuthorizedUsers(users);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  useEffect(() => {
    if (!activeViewingUserId) return;
    const loadSubjects = async () => {
      setIsLoading(true);
      try {
        const subjects = await db.getSubjects(activeViewingUserId);
        setAllSubjects(subjects);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubjects();
  }, [activeViewingUserId]);

  const handleAddTopic = async (subjectId: string, name: string, content: string) => {
    setIsLoading(true);
    setLoadingMsg("Inteligencia Artificial formateando contenido...");
    
    try {
      // Formatear contenido con IA antes de guardar
      const formatted = await formatLessonContent(content);
      
      const targetSubject = allSubjects.find(s => s.id === subjectId);
      if (!targetSubject) return;

      const newTopic: Topic = {
        id: crypto.randomUUID(),
        name,
        content: formatted,
        quizHistory: [],
        chatHistory: [],
        notes: []
      };

      const updatedSubject = { ...targetSubject, topics: [...targetSubject.topics, newTopic] };
      await db.updateSubject(updatedSubject);
      setAllSubjects(prev => prev.map(s => s.id === subjectId ? updatedSubject : s));
    } finally {
      setIsLoading(false);
      setLoadingMsg(undefined);
    }
  };

  const updateTopic = async (subjectId: string, topicId: string, updates: Partial<Topic>) => {
    const targetSubject = allSubjects.find(s => s.id === subjectId);
    if (!targetSubject) return;

    const updatedSubject = {
      ...targetSubject,
      topics: targetSubject.topics.map(t => t.id === topicId ? { ...t, ...updates } : t)
    };

    setIsLoading(true);
    try {
      await db.updateSubject(updatedSubject);
      setAllSubjects(prev => prev.map(s => s.id === subjectId ? updatedSubject : s));
    } finally {
      setIsLoading(false);
    }
  };

  // Otras funciones handle heredadas sin cambios críticos de lógica
  const handleLogin = (user: User, password?: string) => {
    const normalizedEmail = user.email.toLowerCase();
    const authEntry = authorizedUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (authEntry) {
      if (password !== undefined && authEntry.password !== password) throw new Error("Contraseña incorrecta.");
      const userData = { ...user, id: authEntry.id, name: authEntry.name || user.name, isAdmin: authEntry.isAdmin };
      setCurrentUser(userData);
      localStorage.setItem('study_master_user', JSON.stringify(userData));
      setViewState({ type: 'dashboard' });
    } else throw new Error(`Acceso denegado.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSupervisedUser(null);
    localStorage.removeItem('study_master_user');
    setViewState({ type: 'login' });
  };

  if (!currentUser || viewState.type === 'login') return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isLoading && <LoadingOverlay message={loadingMsg} />}
      
      <Header 
        user={currentUser}
        onHome={() => setViewState({ type: 'dashboard' })} 
        onAdmin={() => setViewState({ type: 'admin' })}
        onResults={() => setViewState({ type: 'results' })}
        onLogout={handleLogout}
        onChangePassword={async (newPass) => {
          const updated = authorizedUsers.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u);
          await db.saveAuthorizedUsers(updated);
          setAuthorizedUsers(updated);
        }}
        isSupervising={!!supervisedUser}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {viewState.type === 'dashboard' && (
          <Dashboard 
            subjects={allSubjects} 
            onAddSubject={async (n, i) => {
              setIsLoading(true);
              const newSub: Subject = { id: crypto.randomUUID(), ownerId: activeViewingUserId, name: n, icon: i, topics: [] };
              await db.createSubject(newSub);
              setAllSubjects(p => [...p, newSub]);
              setIsLoading(false);
            }} 
            onSelectSubject={(id) => setViewState({ type: 'subject', subjectId: id })}
            onSelectRetos={() => setViewState({ type: 'retos' })}
            isReadOnly={!!supervisedUser}
          />
        )}

        {viewState.type === 'retos' && (
          <RetosView 
            subjects={allSubjects}
            onSelectTopic={(sId, tId) => setViewState({ type: 'topic', subjectId: sId, topicId: tId })}
            onBack={() => setViewState({ type: 'dashboard' })}
          />
        )}

        {viewState.type === 'results' && (
          <ResultsPanel 
            subjects={allSubjects} 
            onBack={() => setViewState({ type: 'dashboard' })} 
          />
        )}

        {viewState.type === 'subject' && (
          <SubjectView 
            subject={allSubjects.find(s => s.id === viewState.subjectId)!}
            onBack={() => setViewState({ type: 'dashboard' })}
            onAddTopic={(name, content) => handleAddTopic(viewState.subjectId, name, content)}
            onSelectTopic={(topicId) => setViewState({ type: 'topic', subjectId: viewState.subjectId, topicId })}
            onDeleteSubject={async () => {
              setIsLoading(true);
              await db.deleteSubject(viewState.subjectId);
              setAllSubjects(p => p.filter(s => s.id !== viewState.subjectId));
              setViewState({ type: 'dashboard' });
              setIsLoading(false);
            }}
            isReadOnly={!!supervisedUser}
          />
        )}

        {viewState.type === 'topic' && (
          <TopicView 
            subject={allSubjects.find(s => s.id === viewState.subjectId)!}
            topic={allSubjects.find(s => s.id === viewState.subjectId)?.topics.find(t => t.id === viewState.topicId)!}
            onBack={() => setViewState({ type: 'subject', subjectId: viewState.subjectId })}
            onUpdateTopic={(updates) => updateTopic(viewState.subjectId, viewState.topicId, updates)}
            onSaveAttempt={async (attempt) => {
              const target = allSubjects.find(s => s.id === viewState.subjectId);
              if (!target) return;
              const updated = {
                ...target,
                topics: target.topics.map(t => t.id === viewState.topicId ? { ...t, quizHistory: [attempt, ...t.quizHistory] } : t)
              };
              await db.updateSubject(updated);
              setAllSubjects(p => p.map(s => s.id === viewState.subjectId ? updated : s));
            }}
            onDeleteTopic={async () => {
              const target = allSubjects.find(s => s.id === viewState.subjectId);
              if (!target) return;
              const updated = { ...target, topics: target.topics.filter(t => t.id !== viewState.topicId) };
              await db.updateSubject(updated);
              setAllSubjects(p => p.map(s => s.id === viewState.subjectId ? updated : s));
              setViewState({ type: 'subject', subjectId: viewState.subjectId });
            }}
            isReadOnly={!!supervisedUser}
          />
        )}

        {viewState.type === 'admin' && currentUser.isAdmin && (
          <AdminPanel 
            authorizedUsers={authorizedUsers} 
            onUpdateUsers={async (u) => { await db.saveAuthorizedUsers(u); setAuthorizedUsers(u); }} 
            onBack={() => setViewState({ type: 'dashboard' })}
            onSupervise={(u) => { setSupervisedUser(u); setViewState({ type: 'dashboard' }); }}
            currentUserId={currentUser.id}
          />
        )}
      </main>
    </div>
  );
};

export default App;
