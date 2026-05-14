import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, CreditCard,
  Bell, ClipboardList, Sliders,
  LogOut, X, ChevronRight, ShieldCheck, Tag, TrendingDown, FileText, Map
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/useUIStore';
import { Avatar } from './Avatar';
import { useTranslation } from 'react-i18next';
import logoSrc from '../assets/logo.jpeg';

const navItems = [
  { path: '/dashboard', labelKey: 'sidebar.dashboard',    icon: LayoutDashboard },
  { path: '/leads',     labelKey: 'sidebar.leads',        icon: Bell },
  { path: '/projects',  labelKey: 'sidebar.projects_new', icon: Briefcase },
  { path: '/quotes',    labelKey: 'sidebar.quotes',       icon: FileText },
  { path: '/clients',   labelKey: 'sidebar.clients',      icon: Users },
  { path: '/services',  labelKey: 'sidebar.services',     icon: Tag },
  { path: '/payments',  labelKey: 'sidebar.payments',     icon: CreditCard },
  { path: '/expenses',  labelKey: 'sidebar.expenses',     icon: TrendingDown },
  { path: '/history',   labelKey: 'sidebar.history',      icon: ClipboardList },
  { path: '/map',       labelKey: 'sidebar.map',          icon: Map },
  { path: '/settings',  labelKey: 'sidebar.settings',     icon: Sliders },
];

const mobileNavItems = [
  { path: '/dashboard',  labelKey: 'sidebar.home',            icon: LayoutDashboard },
  { path: '/projects',   labelKey: 'sidebar.projects_mobile', icon: Briefcase },
  { path: '/clients',    labelKey: 'sidebar.clients',         icon: Users },
  { path: '/map',        labelKey: 'sidebar.map',             icon: Map },
  { path: '/payments',   labelKey: 'sidebar.payments',        icon: CreditCard },
  { path: '/settings',   labelKey: 'sidebar.settings',        icon: Sliders },
];

export default function Sidebar({ onLogout }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  const brandColor   = 'var(--brand, #00D084)';
  const brandRGB     = 'var(--brand-rgb, 0, 208, 132)';
  const sidebarBg    = 'var(--bg-card, #0A1A0F)';
  const borderColor  = 'var(--border-glass, rgba(255,255,255,0.07))';
  const textColor    = 'var(--text-main, #fff)';
  const textMuted    = 'var(--text-muted, rgba(255,255,255,0.4))';

  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: '16px', left: '16px', right: '16px',
        background: `rgba(var(--bg-main-rgb, 6, 17, 9), 0.95)`,
        backdropFilter: 'blur(24px)',
        border: `1px solid ${borderColor}`,
        borderRadius: '28px',
        padding: '10px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000,
        boxShadow: `0 20px 40px rgba(0,0,0,0.6)`,
      }}>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px', borderRadius: '20px',
                background: active ? `rgba(${brandRGB}, 0.12)` : 'transparent',
                border: 'none', cursor: 'pointer',
                color: active ? brandColor : textMuted,
                transition: 'all 0.3s ease',
                flex: 1,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: '0.55rem', fontWeight: active ? 900 : 700, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em', textAlign: 'center' }}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside style={{
      position: 'relative',
      height: '100vh',
      background: sidebarBg,
      borderRight: `1px solid ${borderColor}`,
      transition: 'width 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      width: sidebarOpen ? '320px' : '92px',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, flexShrink: 0,
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(${brandRGB}, 0.08), transparent)`, pointerEvents: 'none' }} />

      <div style={{ 
        padding: sidebarOpen ? '24px' : '24px 12px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0, 
        position: 'relative',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <motion.div 
            animate={{ width: sidebarOpen ? 160 : 64, height: sidebarOpen ? 'auto' : 64 }}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '24px',
              overflow: 'hidden'
            }} 
          >
            <img src={logoSrc} alt="Greenlife Logo" style={{ width: '100%', mixBlendMode: 'screen', filter: 'contrast(1.2)' }} />
          </motion.div>
        </button>
      </div>

      <nav style={{ 
        flex: 1, 
        padding: '36px 14px 12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        overflowY: 'auto'
      }} className="hide-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: sidebarOpen ? '14px 20px' : '16px', 
                borderRadius: '20px', border: 'none', cursor: 'pointer',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: active ? `linear-gradient(90deg, rgba(${brandRGB}, 0.1), transparent)` : 'transparent',
                color: active ? brandColor : textMuted,
                transition: 'all 0.2s ease',
                width: '100%', outline: 'none', position: 'relative',
              }}
            >
              {active && (
                <motion.div layoutId="active-marker" 
                  style={{ 
                    position: 'absolute', left: 0, top: '25%', bottom: '25%', 
                    width: '4px', background: brandColor, borderRadius: '0 4px 4px 0',
                    boxShadow: `0 0 15px ${brandColor}` 
                  }} 
                />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ marginLeft: '16px', flex: 1, textAlign: 'left', fontWeight: active ? 800 : 600, fontSize: '0.9rem', color: active ? textColor : textMuted }}>
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '24px 20px', borderTop: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', gap: '12px' }}>
          {sidebarOpen && (
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: textColor }}>{user?.username}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: textMuted, textTransform: 'uppercase' }}>{user?.role}</p>
            </div>
          )}
          
          <button 
            onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
            style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: `rgba(${brandRGB}, 0.1)`, color: brandColor, border: `1px solid rgba(${brandRGB}, 0.2)`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '0.7rem'
            }}
          >
            {i18n.language.toUpperCase()}
          </button>

          <button onClick={onLogout}
            style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
