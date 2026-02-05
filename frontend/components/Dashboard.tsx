
import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { db } from '../services/databaseService';

interface DashboardProps {
  subjects: Subject[];
  onAddSubject: (name: string, icon: string) => void;
  onSelectSubject: (id: string) => void;
  onSelectRetos: () => void;
  isReadOnly?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ subjects, onAddSubject, onSelectSubject, onSelectRetos, isReadOnly }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(db.getStreak().count);
  }, []);

  const icons = ['book', 'flask', 'calculator', 'globe', 'language', 'microscope', 'music', 'palette', 'dna', 'atom', 'laptop-code', 'landmark'];

  const now = new Date();
  const reviewedToday = subjects.reduce((acc, s) => acc + s.topics.reduce((tAcc, t) => {
    const todayQuiz = t.quizHistory?.some(q => new Date(q.date).toDateString() === now.toDateString());
    return tAcc + (todayQuiz ? 1 : 0);
  }, 0), 0);

  const dailyGoal = 3;
  const progressPercent = Math.min((reviewedToday / dailyGoal) * 100, 100);
  const pendingRetos = subjects.reduce((acc, s) => acc + s.topics.filter(t => t.nextReviewDate && new Date(t.nextReviewDate) <= now).length, 0);

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tu progreso de hoy</p>
              <h2 className="text-3xl font-black text-slate-800">
                {reviewedToday >= dailyGoal ? '¡Meta alcanzada!' : `${dailyGoal - reviewedToday} repasos para la meta`}
              </h2>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${reviewedToday >= dailyGoal ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-indigo-50 text-indigo-600'}`}>
              <i className={reviewedToday >= dailyGoal ? "fas fa-check-double" : "fas fa-bullseye"}></i>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${reviewedToday >= dailyGoal ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>{reviewedToday} completados</span>
            <span>Meta: {dailyGoal} temas</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
          <i className="fas fa-fire absolute -right-4 -bottom-4 text-8xl text-white/10 group-hover:scale-110 transition-transform"></i>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Racha actual</p>
          <p className="text-5xl font-black mb-2 relative z-10">{streak} <span className="text-xl font-bold opacity-80 uppercase tracking-tighter">Días</span></p>
          <p className="text-xs font-medium text-white/80 relative z-10">¡Mantén el ritmo!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Asignaturas <span className="text-slate-300 font-medium ml-2">{subjects.length}</span></h2>
            {!isReadOnly && (
              <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0">
                <i className="fas fa-plus"></i> Nueva Asignatura
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:border-indigo-500 hover:shadow-2xl transition-all text-left group flex flex-col gap-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shadow-sm group-hover:shadow-indigo-200 transition-all duration-300">
                  <i className={`fas fa-${subject.icon} text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors mb-1">{subject.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subject.topics.length} temas cargados</p>
                </div>
              </button>
            ))}
            
            {!isReadOnly && subjects.length === 0 && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center hover:bg-slate-100 hover:border-slate-300 transition-all group"
              >
                <i className="fas fa-folder-plus text-3xl text-slate-300 mb-4 group-hover:scale-110 transition-transform"></i>
                <p className="text-slate-400 font-bold">Comienza creando tu primera asignatura</p>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={onSelectRetos}
            className="w-full bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 group hover:bg-black transition-all relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="text-left">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Plan de Estudio</p>
              <h3 className="text-xl font-black text-white leading-tight">Tienes {pendingRetos} retos pendientes</h3>
              <p className="text-indigo-400 text-xs font-bold mt-4 flex items-center gap-2">
                Ir al plan <i className="fas fa-arrow-right text-[10px]"></i>
              </p>
            </div>
          </button>

          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem]">
            <h4 className="text-indigo-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-info-circle"></i> Almacenamiento
            </h4>
            <p className="text-indigo-700/70 text-xs font-medium leading-relaxed">
              Tus datos se guardan de forma segura y local en este navegador. No necesitas conexión para ver tus lecciones.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black mb-8 text-slate-900">Nueva Asignatura</h2>
            <form onSubmit={(e) => { e.preventDefault(); onAddSubject(newSubjectName, selectedIcon); setIsModalOpen(false); }}>
              <input 
                type="text" required autoFocus value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 mb-6 focus:border-indigo-500 focus:bg-white transition-all bg-slate-50 text-slate-900 font-bold outline-none"
                placeholder="Nombre de la asignatura"
              />
              <div className="grid grid-cols-4 gap-3 mb-8">
                {icons.map(icon => (
                  <button key={icon} type="button" onClick={() => setSelectedIcon(icon)} className={`h-12 rounded-xl border-2 transition-all flex items-center justify-center ${selectedIcon === icon ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-300 hover:bg-slate-50'}`}>
                    <i className={`fas fa-${icon}`}></i>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
