
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User, password?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Pequeño retardo para dar feedback visual de "procesando"
    setTimeout(() => {
      try {
        onLogin({
          id: crypto.randomUUID(),
          name: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          picture: `https://ui-avatars.com/api/?name=${normalizedEmail}&background=4f46e5&color=fff`,
          isAdmin: false
        }, password);
      } catch (err: any) {
        setError(err.message || 'Error al iniciar sesión');
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl text-white flex items-center justify-center mx-auto mb-6 shadow-[0_20px_50px_rgba(79,70,229,0.3)] rotate-3">
            <i className="fas fa-graduation-cap text-4xl"></i>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2">StudyMaster <span className="text-indigo-400">AI</span></h1>
          <p className="text-slate-400 font-medium">Tu plataforma de estudio inteligente</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Bienvenido de nuevo</h2>
            <p className="text-slate-400 text-sm font-medium">Introduce tus credenciales para acceder</p>
          </div>
          
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-shake">
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@gecoas.com"
                  className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  <>
                    Entrar al Sistema <i className="fas fa-arrow-right text-xs"></i>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-10 mt-10 border-t border-slate-50 text-center">
            <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">Acceso Seguro • Gecoas Learning</p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-500 text-xs font-medium">
          ¿Problemas para acceder? Contacta con administración.
        </p>
      </div>
    </div>
  );
};

export default Login;
