
import React, { useState } from 'react';
import { Subject, Topic, QuizAttempt, QuizQuestion, ChatMessage, Note, Flashcard } from '../types';
import { generateSummary, generateQuiz, askQuestion, generateFlashcards } from '../services/geminiService';
import { db } from '../services/databaseService';
import QuizView from './QuizView';
import SummaryView from './SummaryView';
import ChatPanel from './ChatPanel';
import NotesPanel from './NotesPanel';
import FlashcardView from './FlashcardView';

interface TopicViewProps {
  subject: Subject;
  topic: Topic;
  onBack: () => void;
  onUpdateTopic: (updates: Partial<Topic>) => void;
  onSaveAttempt: (attempt: QuizAttempt) => void;
  onDeleteTopic: () => void;
  isReadOnly?: boolean;
}

const TopicView: React.FC<TopicViewProps> = ({ subject, topic, onBack, onUpdateTopic, onSaveAttempt, onDeleteTopic, isReadOnly }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'flashcards' | 'quiz' | 'chat' | 'notes'>('content');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<QuizAttempt | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showQuizSelector, setShowQuizSelector] = useState(false);

  const handleGenerateSummary = async () => {
    if (isReadOnly) return;
    setLoading(true);
    try {
      const summary = await generateSummary(topic.content);
      onUpdateTopic({ summary });
      setActiveTab('summary');
    } catch (err) {
      setError("Error al generar resumen.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (isReadOnly) return;
    setLoading(true);
    try {
      const flashcards = await generateFlashcards(topic.content);
      onUpdateTopic({ flashcards });
      setActiveTab('flashcards');
    } catch (err) {
      setError("Error al generar tarjetas.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishQuiz = (score: number, total: number, userAnswers: (number | null)[]) => {
    if (!activeQuizQuestions) return;
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      score,
      total,
      questions: activeQuizQuestions,
      userAnswers,
      isRetry: isRetrying,
      isReviewed: false 
    };
    
    // Actualizar Racha
    db.updateStreak();

    // Algoritmo SRS simple
    const successRatio = score / total;
    const daysToAdd = successRatio >= 0.9 ? 14 : successRatio >= 0.7 ? 7 : successRatio >= 0.5 ? 3 : 1;
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    onUpdateTopic({ nextReviewDate: nextDate.toISOString() });
    onSaveAttempt(attempt);
    setActiveQuizQuestions(null);
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
             <i className={`fas fa-${subject.icon} text-indigo-500`}></i> {subject.name}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{topic.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-2">
          {[
            { id: 'content', icon: 'file-lines', label: 'Material' },
            { id: 'summary', icon: 'wand-magic-sparkles', label: 'Resumen' },
            { id: 'flashcards', icon: 'layer-group', label: 'Tarjetas' },
            { id: 'quiz', icon: 'clipboard-question', label: 'Repaso' },
            { id: 'chat', icon: 'comments', label: 'Tutor IA' },
            { id: 'notes', icon: 'note-sticky', label: 'Apuntes' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all border-2 relative ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-white hover:border-indigo-100 hover:bg-indigo-50/30'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                <i className={`fas fa-${tab.icon} text-xs`}></i>
              </div>
              <span className="font-bold text-sm">{tab.label}</span>
              {tab.id === 'notes' && (topic.notes?.length || 0) > 0 && (
                <span className={`absolute right-4 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${activeTab === 'notes' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                  {topic.notes.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3 min-h-[500px]">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mb-4"></div>
                <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">IA Procesando...</p>
              </div>
            )}
            
            {activeTab === 'content' && (
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 mb-6 pb-4 border-b border-slate-50 flex items-center gap-2">
                  <i className="fas fa-file-alt text-indigo-500"></i> Material de Estudio
                </h3>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {topic.content}
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              topic.summary ? <SummaryView summary={topic.summary} onRegenerate={handleGenerateSummary} /> : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-fade-in">
                   <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-6"><i className="fas fa-wand-magic-sparkles text-3xl"></i></div>
                   <h3 className="text-xl font-black mb-2">Resumen Estratégico</h3>
                   <p className="text-slate-400 mb-8 max-w-xs text-sm">Deja que la IA extraiga los conceptos clave por ti en segundos.</p>
                   <button onClick={handleGenerateSummary} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Generar con IA</button>
                </div>
              )
            )}

            {activeTab === 'flashcards' && (
              topic.flashcards ? <FlashcardView flashcards={topic.flashcards} onRegenerate={handleGenerateFlashcards} /> : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-fade-in">
                   <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6"><i className="fas fa-layer-group text-3xl"></i></div>
                   <h3 className="text-xl font-black mb-2">Tarjetas de Memoria</h3>
                   <p className="text-slate-400 mb-8 max-w-xs text-sm">Entrena tu recuperación activa con tarjetas auto-generadas.</p>
                   <button onClick={handleGenerateFlashcards} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Crear Flashcards</button>
                </div>
              )
            )}

            {activeTab === 'quiz' && (
              <div className="flex-1 flex flex-col">
                {activeQuizQuestions ? (
                  <QuizView questions={activeQuizQuestions} onFinish={handleFinishQuiz} />
                ) : reviewAttempt ? (
                  <QuizView questions={reviewAttempt.questions} reviewAttempt={reviewAttempt} onCloseReview={() => setReviewAttempt(null)} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-8"><i className="fas fa-bolt text-3xl"></i></div>
                    <button 
                      onClick={() => setShowQuizSelector(true)} 
                      className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                    >
                      Iniciar Reto de Repaso
                    </button>
                    {topic.quizHistory.length > 0 && (
                      <p className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Último acierto: {Math.round((topic.quizHistory[0].score / topic.quizHistory[0].total) * 100)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && <ChatPanel history={topic.chatHistory || []} onSendMessage={async (t) => {
              const userMsg: ChatMessage = { role: 'user', text: t };
              const history = [...(topic.chatHistory || []), userMsg];
              onUpdateTopic({ chatHistory: history });
              const aiResp = await askQuestion(topic.content, history, t);
              onUpdateTopic({ chatHistory: [...history, { role: 'model', text: aiResp }] });
            }} onSaveNote={(text) => onUpdateTopic({ notes: [...(topic.notes || []), { id: crypto.randomUUID(), text, date: new Date().toISOString() }] })} onClearHistory={() => onUpdateTopic({ chatHistory: [] })} />}
            
            {activeTab === 'notes' && <NotesPanel notes={topic.notes || []} onRemoveNote={(id) => onUpdateTopic({ notes: topic.notes.filter(n => n.id !== id) })} />}
          </div>
        </div>
      </div>

      {showQuizSelector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl animate-scale-in text-center">
            <h3 className="text-2xl font-black mb-8 text-slate-900">¿Longitud del reto?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={async () => { setShowQuizSelector(false); setLoading(true); const q = await generateQuiz(topic.content, 5); setActiveQuizQuestions(q); setLoading(false); }} className="p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 transition-all group">
                <span className="block text-3xl font-black text-slate-300 group-hover:text-indigo-600 mb-1">5</span>
                <span className="text-[10px] font-black uppercase text-slate-400">Rápido</span>
              </button>
              <button onClick={async () => { setShowQuizSelector(false); setLoading(true); const q = await generateQuiz(topic.content, 10); setActiveQuizQuestions(q); setLoading(false); }} className="p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 transition-all group">
                <span className="block text-3xl font-black text-slate-300 group-hover:text-indigo-600 mb-1">10</span>
                <span className="text-[10px] font-black uppercase text-slate-400">Completo</span>
              </button>
            </div>
            <button onClick={() => setShowQuizSelector(false)} className="mt-8 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicView;
