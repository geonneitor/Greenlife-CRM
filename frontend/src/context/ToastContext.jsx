import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X, WifiOff, Wifi } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      notify('Conexión restaurada vía satélite', 'success');
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const confirm = (message, onConfirm, options = {}) => {
    setConfirmDialog({ message, onConfirm, options });
  };
  
  const closeConfirm = () => setConfirmDialog(null);

  return (
    <ToastContext.Provider value={{ notify, confirm, isOffline }}>
      {children}
      
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 w-full z-[100] bg-rose-600 border-b border-rose-500 shadow-lg shadow-rose-600/20"
          >
             <div className="flex items-center justify-center gap-3 py-2 px-4 text-white text-[10px] font-bold tracking-wider">
                <WifiOff size={14} className="animate-pulse" />
                Estás sin conexión - Esperando red...
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toasts */}
      <div className="fixed top-12 right-4 md:right-8 z-[90] flex flex-col gap-3 pointer-events-none w-[90%] md:w-80">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-4 rounded-2xl flex items-start gap-3 shadow-2xl border backdrop-blur-3xl overflow-hidden relative ${
                toast.type === 'success' ? 'bg-brand/10 border-brand text-brand' :
                toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' :
                'bg-slate-800 border-slate-600 text-white'
              }`}
            >
              {/* Type Icons */}
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle size={18} />}
                {toast.type === 'error' && <AlertTriangle size={18} />}
                {toast.type === 'info' && <Info size={18} />}
              </div>
              
              <div className="flex-1 text-sm font-bold leading-tight pt-0.5 mr-6 font-fredoka tracking-tight">
                {toast.message}
              </div>
              
              <button 
                 onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                 className="absolute top-4 right-3 text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                  <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-base border border-white/10 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-5">
                 <AlertTriangle size={100} />
               </div>
               
               <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 relative z-10 ${
                 confirmDialog.options.danger ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'
               }`}>
                 <AlertTriangle size={24} />
               </div>
               
               <h3 className="text-xl font-bold font-fredoka text-white  tracking-tight mb-3 relative z-10">
                 {confirmDialog.options.title || '¿Estás Seguro?'}
               </h3>
               
               <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed relative z-10">
                 {confirmDialog.message}
               </p>
               
               <div className="flex items-center gap-3 relative z-10">
                 <button 
                    onClick={closeConfirm}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white text-[10px]  tracking-widest transition-all shadow-inner"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={() => {
                        confirmDialog.onConfirm();
                        closeConfirm();
                    }}
                    className={`flex-1 py-4 rounded-xl font-bold text-[10px]  tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 text-slate-950 ${
                      confirmDialog.options.danger ? 'bg-rose-500 shadow-rose-500/20' : 'bg-brand shadow-brand/20'
                    }`}
                 >
                    {confirmDialog.options.confirmText || 'Sí, Hacerlo'}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

