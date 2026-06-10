import React, { useState } from 'react';
import { api } from '../services/api';
import { Trophy, Mail, Lock, User, Key, Eye, EyeOff, Info } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [poolCode, setPoolCode] = useState('MUNDIAL2026');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Por favor ingresa tu nombre.');
        if (!email.trim()) throw new Error('Por favor ingresa tu correo.');
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        if (poolCode.trim().toUpperCase() !== 'MUNDIAL2026') {
          throw new Error('El código de la polla es incorrecto. Pídelo a tu administrador amigo.');
        }

        // Register
        await api.signUp(email, password, name, poolCode);
        
        // Auto sign in after sign up
        const user = await api.signIn(email, password);
        onLoginSuccess(user);
      } else {
        if (!email.trim() || !password.trim()) throw new Error('Ingresa correo y contraseña.');
        
        // Login
        const user = await api.signIn(email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-soccer/20 blur-3xl -z-10 animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-gold/10 blur-3xl -z-10 animate-pulse duration-[8000ms]"></div>
      
      <div className="w-full max-w-md">
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-br from-soccer to-soccer-dark border border-soccer-light/30 shadow-lg shadow-soccer/20 mb-4 animate-bounce duration-[3000ms]">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Polla Mundialista
          </h1>
          <p className="text-slate-400 font-medium tracking-wide mt-2 text-sm uppercase">
            Copa del Mundo FIFA 2026 🇨🇦🇲🇽🇺🇸
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Una competencia privada y divertida entre amigos.
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="glass-panel border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-center text-white mb-6">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
              <span className="font-semibold mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Jhonatan F."
                    className="w-full glass-input pl-12 pr-4 py-3 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full glass-input pl-12 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full glass-input pl-12 pr-12 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegistering && (
                <p className="text-slate-500 text-xs mt-1.5 pl-1">
                  Mínimo 6 caracteres.
                </p>
              )}
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Código de Invitación de Polla</span>
                  <span className="text-[10px] text-soccer font-bold lowercase">Requerido</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={poolCode}
                    onChange={(e) => setPoolCode(e.target.value)}
                    placeholder="MUNDIAL2026"
                    className="w-full glass-input pl-12 pr-4 py-3 text-sm tracking-wider uppercase font-semibold text-gold"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1.5 pl-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Código predeterminado: <code className="text-gold font-bold">MUNDIAL2026</code></span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-soccer to-soccer-dark hover:from-soccer-light hover:to-soccer rounded-xl font-bold text-white shadow-lg shadow-soccer/20 hover:shadow-soccer/30 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : isRegistering ? (
                'Crear cuenta y Entrar'
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Toggle Screen Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-400">
              {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
            </span>{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-soccer font-bold hover:text-soccer-light hover:underline transition-all ml-1"
            >
              {isRegistering ? 'Inicia sesión aquí' : 'Regístrate ahora'}
            </button>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        {!isRegistering && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 text-center text-xs text-slate-500 flex flex-col gap-1">
            <span className="font-semibold text-slate-400">Modo Demo Local Disponible</span>
            <span>Admin: <strong className="text-slate-300">admin@example.com</strong> (clave libre)</span>
            <span>Jugador: <strong className="text-slate-300">jugador@example.com</strong> (clave libre)</span>
          </div>
        )}
      </div>
    </div>
  );
}
