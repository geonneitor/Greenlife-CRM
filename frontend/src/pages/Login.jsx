import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, X, Loader2, Sparkles, User as UserIcon, ShieldCheck, Zap, Globe, Leaf, KeyRound, Mail, Smartphone } from 'lucide-react';
import { authApi } from '../api/auth';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/useNotificationStore';
import logoSrc from '../assets/logo.jpeg';


const Login = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotificationStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Flow
  const [recoveryStep, setRecoveryStep] = useState(0); // 0: login, 1: code sent, 2: reset pin
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');

  const { login } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await authApi.listUsers();
        const mappedUsers = data.map(u => ({
          ...u,
          name: u.username,
          color: '#C9A84C'
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handlePinInput = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      if (window.navigator.vibrate) window.navigator.vibrate(5);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedUser) return;
      if (recoveryStep > 0) return; // Disable keyboard PIN during recovery
      if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
      if (e.key === 'Backspace') setPin(prev => prev.slice(0, -1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pin, recoveryStep]);

  useEffect(() => {
    if (pin.length === 6) {
      handleFinalLogin();
    }
  }, [pin]);

  const handleFinalLogin = async () => {
    setIsSubmitting(true);
    setError('');
    const result = await login(selectedUser.username, pin);
    if (!result.success) {
      setError(result.error.toUpperCase());
      setPin('');
    }
    setIsSubmitting(false);
  };

  const handleStartRecovery = async () => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPin(selectedUser.username);
      addNotification('Código enviado por Email/SMS', 'success');
      setRecoveryStep(1);
    } catch (err) {
      setError(err.response?.data?.detail || "ERROR DE CONEXIÓN");
      addNotification(err.response?.data?.detail || 'Error al iniciar recuperación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    try {
      await authApi.verifyOtp(selectedUser.username, otp);
      setRecoveryStep(2);
    } catch (err) {
      addNotification('Código incorrecto o expirado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPin = async () => {
    if (newPin.length !== 6) {
      addNotification('El PIN debe ser de 6 dígitos', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPinRecovery(selectedUser.username, otp, newPin);
      addNotification('PIN actualizado. Ya puedes ingresar.', 'success');
      setRecoveryStep(0);
      setOtp('');
      setNewPin('');
      setPin('');
    } catch (err) {
      addNotification('Error al reestablecer PIN', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#061109] text-white selection:bg-brand selection:text-black overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img src="/GREENLIFELLC.jpeg" className="w-full h-full object-cover opacity-40" alt="background" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#061109] via-transparent to-[#061109] opacity-80" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12 border-r border-white/5 overflow-hidden backdrop-blur-sm bg-black/20">
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 flex flex-col items-center"
          >
            <div className="w-56 h-56 bg-brand/5 border-2 border-brand/20 rounded-[3.5rem] flex items-center justify-center shadow-2xl mb-10 overflow-hidden group">
              <motion.img
                src={logoSrc}
                alt="Greenlife Logo"
                className="w-full h-full object-cover mix-blend-screen opacity-90 group-hover:scale-110 transition-transform duration-700"
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ delay: 0.2, duration: 1 }}
              />
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-2 uppercase text-center">GREENLIFE</h1>
            <p className="text-brand font-black tracking-[0.6em] text-[11px] uppercase opacity-80">Enterprise CRM</p>
          </motion.div>
        </div>
      </div>


      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-sm">
          {!selectedUser ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-black mb-1 uppercase text-brand">{t('login.welcome')}</h3>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.3em]">{t('login.select_profile')}</p>
              </div>

              <div className="space-y-3">
                {isLoadingUsers ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <Loader2 className="text-brand animate-spin" size={32} />
                  </div>
                ) : (
                  users.map((user) => (
                    <motion.button
                      key={user.id}
                      whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.03)' }}
                      onClick={() => handleUserSelect(user)}
                      className="w-full bg-[#0A1A0F] border border-white/5 p-5 rounded-[2rem] flex items-center gap-5 transition-all hover:border-brand/40"
                    >
                      <Avatar user={user} size="sm" />
                      <div className="flex-1 text-left">
                        <h4 className="text-lg font-black uppercase tracking-tight text-white">{user.name}</h4>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{user.role}</p>
                      </div>
                      <Lock size={16} className="text-white/10" />
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/60 backdrop-blur-xl border border-brand/20 p-8 rounded-[3rem] shadow-2xl relative flex flex-col items-center"
            >
              <button onClick={() => { setSelectedUser(null); setPin(''); setError(''); setRecoveryStep(0); }} className="absolute top-8 right-8 text-white/20 hover:text-white"><X size={24} /></button>

              <Avatar user={selectedUser} size="md" className="mb-4" />
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{selectedUser.name}</h2>
              <p className="text-white/30 text-[8px] font-bold uppercase tracking-[0.3em] mb-8">{t('login.enter_pin')}</p>

              <div className="flex gap-4 mb-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border transition-all ${pin.length > i ? 'bg-brand border-brand shadow-brand-glow' : 'bg-white/5 border-white/10'}`} />
                ))}
              </div>

              {error && <p className="text-red-500 text-[10px] font-black mb-6 uppercase tracking-widest text-center">Error: {error}</p>}

              <div className="grid grid-cols-3 gap-3 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (num === 'C') { setPin(''); setError(''); }
                      else if (num === 'DEL') setPin(prev => prev.slice(0, -1));
                      else handlePinInput(num.toString());
                    }}
                    className={`h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${num === 'C' || num === 'DEL' ? 'bg-white/5 text-white/20' : 'bg-white/5 hover:bg-brand hover:text-black text-white'}`}
                  >
                    {num === 'DEL' ? <Delete size={20} /> : num}
                  </button>
                ))}
              </div>

              <button onClick={handleStartRecovery} className="mt-8 text-white/20 hover:text-brand text-[8px] font-bold uppercase tracking-widest transition-colors underline underline-offset-4 decoration-white/5">
                {t('login.forgot_pin')}
              </button>

              {isSubmitting && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center z-50">
                  <Loader2 className="text-brand animate-spin mb-4" size={32} />
                  <span className="text-brand font-black text-[10px] uppercase tracking-widest">Validando...</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* RECOVERY MODAL */}
      <AnimatePresence>
        {recoveryStep > 0 && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[2000] p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#0A1A0F] border border-brand/20 p-10 rounded-[3rem] flex flex-col items-center relative">
              <button onClick={() => setRecoveryStep(0)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20} /></button>

              {recoveryStep === 1 ? (
                <>
                  <KeyRound className="text-brand mb-6" size={40} />
                  <h2 className="text-2xl font-black text-white mb-2 uppercase text-center">{t('login.recovering')}</h2>
                  <p className="text-white/40 text-[9px] font-bold uppercase mb-8 text-center">{t('login.enter_code')}</p>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black mb-10 text-center text-3xl outline-none focus:border-brand transition-all tracking-[0.5em]"
                  />

                  <button
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full py-5 bg-brand rounded-2xl text-black font-black uppercase text-xs shadow-brand-glow disabled:opacity-50"
                  >
                    {t('login.verify')}
                  </button>
                </>
              ) : (
                <>
                  <Zap className="text-brand mb-6" size={40} />
                  <h2 className="text-2xl font-black text-white mb-2 uppercase text-center">{t('login.new_pin')}</h2>
                  <p className="text-white/40 text-[9px] font-bold uppercase mb-8 text-center">{t('login.enter_pin')}</p>

                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black mb-10 text-center text-3xl outline-none focus:border-brand transition-all tracking-[0.5em]"
                  />

                  <button
                    onClick={handleResetPin}
                    disabled={isSubmitting || newPin.length !== 6}
                    className="w-full py-5 bg-brand rounded-2xl text-black font-black uppercase text-xs shadow-brand-glow disabled:opacity-50"
                  >
                    {t('login.reset')}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 text-white/5 text-[9px] font-black tracking-[0.5em] uppercase pointer-events-none">
        GREENLIFE ENTERPRISE CRM V1.0
      </div>
    </div>
  );
};

export default Login;
