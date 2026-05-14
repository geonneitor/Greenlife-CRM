import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/useNotificationStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const styles = {
  success: {
    icon: 'color: #00D084',
    bg: 'rgba(0, 208, 132, 0.08)',
    border: 'rgba(0, 208, 132, 0.2)',
    iconEl: <CheckCircle size={18} style={{ color: '#00D084' }} />,
  },
  error: {
    icon: 'color: #D4845A',
    bg: 'rgba(212, 132, 90, 0.10)',
    border: 'rgba(212, 132, 90, 0.25)',
    iconEl: <AlertCircle size={18} style={{ color: '#D4845A' }} />,
  },
  warning: {
    icon: 'color: #C9A05A',
    bg: 'rgba(201, 160, 90, 0.10)',
    border: 'rgba(201, 160, 90, 0.25)',
    iconEl: <AlertTriangle size={18} style={{ color: '#C9A05A' }} />,
  },
  info: {
    icon: 'color: #BFA98C',
    bg: 'rgba(191, 169, 140, 0.10)',
    border: 'rgba(191, 169, 140, 0.22)',
    iconEl: <Info size={18} style={{ color: '#BFA98C' }} />,
  },
};

export const Notifications = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none', width: '100%', maxWidth: '300px' }}>
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => {
          const s = styles[n.type] || styles.info;
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '16px',
                border: `1px solid ${s.border}`,
                backgroundColor: s.bg,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {s.iconEl}
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>{n.message}</span>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', display: 'flex', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
