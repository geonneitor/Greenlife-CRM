import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../store/useConfirmStore';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal() {
  const { isOpen, message, description, onConfirm, onCancel } = useConfirmStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop con Blur y oscurecimiento para estilo nativo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl overflow-hidden"
            style={{ 
              backgroundColor: 'var(--bg-card, #0C2915)',
              borderColor: 'var(--border-glass, rgba(255,255,255,0.1))' 
            }}
          >
            {/* Brillo sutil de fondo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={28} />
              </div>

              <h3 className="text-xl font-black text-main uppercase tracking-tight mb-2" style={{ color: 'var(--text-main, #fff)' }}>
                {message}
              </h3>
              
              <p className="text-sm font-medium text-muted mb-8 leading-relaxed" style={{ color: 'var(--text-muted, #A89880)' }}>
                {description}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all bg-transparent text-main hover:bg-white/5 active:scale-95"
                  style={{ borderColor: 'var(--border-glass, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                  style={{ backgroundColor: 'var(--brand, #10B981)', boxShadow: '0 0 20px var(--brand-glow)' }}
                >
                  Confirmar
                </button>
              </div>
            </div>

            <button 
              onClick={onCancel} 
              className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
