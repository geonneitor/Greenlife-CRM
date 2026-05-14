import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useAuth } from './hooks/useAuth';
import { THEME_CONFIG, FONT_CONFIG } from './themeConfig';
import { useTranslation } from 'react-i18next';



// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Quotes from './pages/Quotes';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Expenses from './pages/Expenses';
import History from './pages/History';
import Payments from './pages/Payments';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Map from './pages/Map';
import LeadsDashboard from './pages/LeadsDashboard';

// Componentes
import Sidebar from './components/Sidebar';
import { Avatar } from './components/Avatar';
import { Notifications } from './components/Notifications';
import ConfirmModal from './components/ConfirmModal';

// Transición de página optimizada
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -8 }}
    transition={{ 
      duration: 0.4, 
      ease: [0.25, 1, 0.5, 1] // Apple-style ease out
    }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);


const ViewLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-brand/10 border-t-brand rounded-full animate-spin" />
  </div>
);

// Ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Títulos por ruta (Landscaping CRM)
const getPageConfig = (path, t) => {
  const configs = {
    '/dashboard':     { title: t('sidebar.dashboard'),   subtitle: t('dashboard.subtitle') },
    '/':              { title: t('sidebar.dashboard'),   subtitle: t('dashboard.subtitle') },
    '/projects':      { title: t('sidebar.projects_mobile'), subtitle: t('sidebar.projects_subtitle') },
    '/leads':         { title: t('sidebar.leads'),          subtitle: t('sidebar.leads_subtitle') },
    '/quotes':        { title: t('sidebar.quotes'),       subtitle: t('sidebar.quotes_subtitle') },
    '/clients':       { title: t('sidebar.clients'),      subtitle: t('sidebar.clients_subtitle') },
    '/services':      { title: t('sidebar.services'),     subtitle: t('sidebar.services_subtitle') },
    '/payments':      { title: t('sidebar.payments'),     subtitle: t('sidebar.payments_subtitle') },
    '/expenses':      { title: t('sidebar.expenses'),     subtitle: t('sidebar.expenses_subtitle') },
    '/history':       { title: t('sidebar.history'),      subtitle: t('sidebar.history_subtitle') },
    '/map':           { title: t('sidebar.map'),           subtitle: 'MAPA DE CLIENTES' },
    '/settings':      { title: t('settings.title'),         subtitle: t('settings.subtitle') },
  };
  return configs[path] || { title: 'Greenlife', subtitle: 'CRM SYSTEM' };
};



// Layout principal (solo para rutas autenticadas)
function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const {
    sidebarOpen,
    theme: currentThemeName,
  } = useUIStore();

  const pageConfig = getPageConfig(location.pathname, t);


  return (
    <div className={`flex h-screen overflow-hidden bg-surface text-main transition-colors duration-500 selection:bg-brand selection:text-white relative ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Notifications />
      <ConfirmModal />

      {/* Sidebar desktop */}
      <div className="hidden md:block shrink-0 no-print">
        <Sidebar onLogout={logout} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col pb-24 md:pb-10 transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-14 shrink-0 px-2 no-print">
          <motion.div
            key={location.pathname + '-header'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-main">
              {pageConfig.title}
            </h1>
            <p className="text-muted font-black tracking-widest text-[9px] mt-2 uppercase opacity-40">
              GLE - {pageConfig.subtitle}
            </p>
          </motion.div>

          <div className="flex items-center gap-4 bg-surface-card p-2 pr-4 rounded-3xl border border-glass shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
            <div className="text-right ml-2">
              <div className="text-sm font-black text-main leading-tight lowercase">{user?.username || 'Usuario'}</div>
              <div className="text-[10px] text-brand font-bold tracking-wider">{user?.role || 'Admin'}</div>
            </div>
            <Avatar user={user} size="md" />
          </div>
        </header>

        <section className="flex-1 relative">
          <Suspense fallback={<ViewLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/leads" element={<PageWrapper><LeadsDashboard /></PageWrapper>} />
                <Route path="/projects" element={<PageWrapper><Projects /></PageWrapper>} />
                <Route path="/quotes" element={<PageWrapper><Quotes /></PageWrapper>} />
                <Route path="/services" element={<PageWrapper><Services /></PageWrapper>} />
                <Route path="/clients" element={<PageWrapper><Clients /></PageWrapper>} />
                <Route path="/payments" element={<PageWrapper><Payments /></PageWrapper>} />
                <Route path="/expenses" element={<PageWrapper><Expenses /></PageWrapper>} />
                <Route path="/history" element={<PageWrapper><History /></PageWrapper>} />
                <Route path="/map" element={<PageWrapper><Map /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </section>
      </main>

      {/* Bottom nav móvil */}
      <div className="md:hidden no-print">
        <Sidebar onLogout={logout} />
      </div>
    </div>
  );
}

function App() {
  const {
    theme: currentThemeName,
    font: currentFontName,
    fontWeight: currentFontWeight,
    letterSpacing: currentLetterSpacing,
  } = useUIStore();
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const theme = THEME_CONFIG[currentThemeName] || THEME_CONFIG.greenlife;
    const font = FONT_CONFIG[currentFontName] || FONT_CONFIG.quicksand;
    const root = document.documentElement;

    root.style.setProperty('--brand', theme.brand);
    root.style.setProperty('--brand-rgb', theme.brandRgb || '10,208,132');
    root.style.setProperty('--brand-glow', theme.shadow);
    root.style.setProperty('--bg-main', theme.bg);
    root.style.setProperty('--bg-card', theme.card);
    root.style.setProperty('--text-main', theme.text);
    root.style.setProperty('--text-muted', theme.muted);
    root.style.setProperty('--border-glass', theme.border);
    root.style.setProperty('--shadow-card', `0 20px 50px ${theme.shadow}`);

    document.body.style.fontFamily = font.family;
    root.style.setProperty('--font-app-main', font.family);
    root.style.setProperty('--font-weight-main', currentFontWeight);
    root.style.setProperty('--app-letter-spacing', `${currentLetterSpacing}px`);
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    root.style.setProperty('--app-easing', theme.animation.easing);
    root.style.setProperty('--app-duration', theme.animation.duration);

    setIsThemeLoading(false);
  }, [currentThemeName, currentFontName, currentFontWeight, currentLetterSpacing]);

  if (isThemeLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border-glass)', borderTopColor: 'var(--brand)' }} />
        <div className="font-bold tracking-wider text-xs animate-pulse" style={{ color: 'var(--brand)' }}>Cargando Greenlife...</div>
      </div>
    );
  }


  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
