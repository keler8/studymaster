
import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  onRegenerate: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcards, onRegenerate }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIdx];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
      <div className="text-center">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Repaso Activo</h3>
        <p className="text-slate-600 font-bold">Tarjeta {currentIdx + 1} de {flashcards.length}</p>
      </div>

      <div 
        className="relative w-full max-w-md aspect-[4/3] cursor-pointer group perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 flex items-center justify-center text-center shadow-xl group-hover:border-indigo-200 transition-colors">
            <div className="absolute top-6 left-6 text-indigo-100">
              <i className="fas fa-question-circle text-4xl"></i>
            </div>
            <p className="text-2xl font-black text-slate-800 leading-tight">{card.front}</p>
            <div className="absolute bottom-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Toca para ver la respuesta</div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 border-2 border-indigo-500 rounded-[2.5rem] p-10 flex items-center justify-center text-center shadow-xl">
             <div className="absolute top-6 left-6 text-white/20">
              <i className="fas fa-lightbulb text-4xl"></i>
            </div>
            <p className="text-xl font-bold text-white leading-relaxed">{card.back}</p>
            <div className="absolute bottom-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Toca para volver a la pregunta</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all flex items-center gap-2"
        >
          <i className="fas fa-rotate"></i> Voltear
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
        >
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      <button 
        onClick={onRegenerate}
        className="text-[10px] font-black text-slate-300 hover:text-indigo-400 transition-colors uppercase tracking-[0.2em]"
      >
        <i className="fas fa-sync-alt mr-2"></i> Generar nuevas tarjetas
      </button>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardView;
