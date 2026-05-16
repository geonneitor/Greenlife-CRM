import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFileUpload } from '../hooks/useFileUpload';
import { useUIStore } from '../store/useUIStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { THEME_CONFIG, FONT_CONFIG } from '../themeConfig';
import {
  User, Shield, Palette, Camera,
  Loader2, CheckCircle2, LogOut, RotateCcw, Check, AlertTriangle, Trash2, Database, Download, Users, Plus, UserPlus, X, Briefcase
} from 'lucide-react';
import Services from './Services';

import { useNotificationStore } from '../store/useNotificationStore';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ─── Estilos del sistema de tarjetas estandarizado ───────────────────────────
const panel = {
  background: 'var(--bg-card, #0A1A0F)',
  border: '1px solid var(--border-glass, rgba(255,255,255,0.07))',
  borderRadius: '24px',
  padding: '24px',
};
const sectionTitle = {
  fontSize: '0.65rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.25)',
  marginBottom: '12px',
};
const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '6px',
};
const readonlyInput = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  padding: '9px 14px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
};
const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
};
// ─────────────────────────────────────────────────────────────────────────────

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, token, updateUser, logout } = useAuth();
  const { uploadFile, isUploading, error: uploadError } = useFileUpload();
  const { theme, font, setTheme, setFont, resetUI } = useUIStore();
  const { addNotification } = useNotificationStore();
  const { ask } = useConfirmStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [clearing, setClearing] = useState(null);

  // Gestión de Usuarios
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', phone: '', role: 'staff' });

  const fetchUsers = async () => {
      if (user?.role !== 'admin') return;
      setIsUsersLoading(true);
      try {
          const res = await apiClient.get('/users/list');
          setUsers(res.data);
      } catch (err) {
          addNotification('Error al cargar usuarios', 'error');
      } finally {
          setIsUsersLoading(false);
      }
  };

  useEffect(() => {
      if (activeTab === 'security' && user?.role === 'admin') {
          fetchUsers();
      }
  }, [activeTab]);

  const handleCreateUser = async (e) => {
      e.preventDefault();
      try {
          await apiClient.post('/users', newUser);
          addNotification('Usuario creado con éxito. Se envió el PIN por email/sms.', 'success');
          setShowCreateForm(false);
          setNewUser({ username: '', email: '', phone: '', role: 'staff' });
          fetchUsers();
      } catch (err) {
          addNotification(err.response?.data?.detail || 'Error al crear usuario', 'error');
      }
  };

  const handleDeleteUser = async (userId) => {
      ask({
          title: 'Eliminar Usuario',
          description: '¿Estás seguro? Esta acción no se puede deshacer.',
          onConfirm: async () => {
              try {
                  await apiClient.delete(`/users/${userId}`);
                  addNotification('Usuario eliminado', 'success');
                  fetchUsers();
              } catch (err) {
                  addNotification('Error al eliminar usuario', 'error');
              }
          }
      });
  };

  const changeLanguage = (lng) => {
      i18n.changeLanguage(lng);
      addNotification(`Idioma cambiado a ${lng === 'es' ? 'Español' : 'English'}`, 'success');
  };

  const TABS = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'services', label: 'Servicios', icon: Briefcase },
  ];

  const handleClearData = (endpoint, type) => {
    ask({
      title: 'Limpieza de Datos',
      description: `¿Estás SEGURO de que deseas borrar todos los registros de ${type}? Esta acción es irreversible.`,
      onConfirm: async () => {
        setClearing(endpoint);
        try {
          await apiClient.delete(endpoint);
          addNotification(`${type} borrados exitosamente`, 'success');
        } catch (err) {
          addNotification(`Error al borrar ${type}`, 'error');
        } finally {
          setClearing(null);
        }
      }
    });
  };

  const handleBackup = async () => {
    setClearing('backup');
    try {
      const response = await apiClient.post('/admin/backup');
      addNotification(`Respaldo creado: ${response.data.path}`, 'success');
    } catch (err) {
      addNotification('Error al crear respaldo', 'error');
    } finally {
      setClearing(null);
    }
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !token) return;
    const result = await uploadFile(selectedFile, token, 'avatar');
    if (result?.success) {
      setUploadSuccess(true);
      setSelectedFile(null);
      setPreview(null);
      updateUser({ avatar_url: result.url, avatar_filename: result.filename });
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
  const avatarSrc = preview
    || (user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${apiUrl}${user.avatar_url}`) : null)
    || (user?.avatar_filename ? `${apiUrl}/uploads/avatars/${user.avatar_filename}` : null);

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%', alignItems: 'flex-start' }}>

      {/* ── Nav lateral ── */}
      <aside style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {TABS.map(({ id, label: tabLabel, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${activeTab === id ? 'rgba(var(--brand-rgb, 0,208,132), 0.25)' : 'transparent'}`,
              background: activeTab === id ? 'rgba(var(--brand-rgb, 0,208,132), 0.08)' : 'transparent',
              color: activeTab === id ? 'var(--brand, #00D084)' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <Icon size={15} />
            {tabLabel}
          </button>
        ))}

        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              border: '1px solid rgba(212,104,90,0.2)',
              background: 'rgba(212,104,90,0.06)',
              color: '#D4685A',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: 'inherit', width: '100%',
            }}
          >
            <LogOut size={15} />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">

          {/* ══ PERFIL ══ */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Avatar + nombre */}
              <div style={{ ...panel, display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(var(--brand-rgb,0,208,132),0.1)', border: '2px solid rgba(var(--brand-rgb,0,208,132),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {avatarSrc
                      ? <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand,#00D084)' }}>{user?.username?.[0]?.toUpperCase()}</span>
                    }
                    {isUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={20} style={{ color: 'var(--brand)' }} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand,#00D084)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-card,#0A1A0F)' }}>
                    <Camera size={12} style={{ color: '#000' }} />
                    <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleFileSelect} />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1.0625rem', color: '#fff' }}>{user?.username}</p>
                  <p style={{ margin: '2px 0 8px', fontSize: '0.75rem', color: 'var(--brand)' }}>{user?.role}</p>
                  {selectedFile && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={handleUploadAvatar} disabled={isUploading}
                        style={{ padding: '5px 12px', borderRadius: '8px', background: 'var(--brand)', color: '#000', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> {t('common.save')}
                      </button>
                      <button onClick={() => { setSelectedFile(null); setPreview(null); }}
                        style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info del usuario (solo lectura) */}
              <div style={panel}>
                <p style={sectionTitle}>{t('settings.profile')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>{t('settings.username')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                      <input readOnly value={user?.username || ''} style={{ ...readonlyInput, paddingLeft: '30px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('settings.role')}</label>
                    <input readOnly value={user?.role || ''} style={readonlyInput} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('settings.email')}</label>
                    <input readOnly value={user?.email || '-'} style={readonlyInput} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('settings.phone')}</label>
                    <input readOnly value={user?.phone || '-'} style={readonlyInput} />
                  </div>
                </div>
              </div>

              {/* Selector de Idioma */}
              <div style={panel}>
                  <p style={sectionTitle}>{t('settings.language_selector')}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => changeLanguage('es')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', 
                            border: `1px solid ${i18n.language === 'es' ? 'var(--brand)' : 'rgba(255,255,255,0.1)'}`,
                            background: i18n.language === 'es' ? 'rgba(var(--brand-rgb), 0.1)' : 'transparent',
                            color: i18n.language === 'es' ? 'var(--brand)' : '#fff',
                            fontWeight: 700, cursor: 'pointer'
                        }}
                      >ESPAÑOL</button>
                      <button 
                        onClick={() => changeLanguage('en')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', 
                            border: `1px solid ${i18n.language === 'en' ? 'var(--brand)' : 'rgba(255,255,255,0.1)'}`,
                            background: i18n.language === 'en' ? 'rgba(var(--brand-rgb), 0.1)' : 'transparent',
                            color: i18n.language === 'en' ? 'var(--brand)' : '#fff',
                            fontWeight: 700, cursor: 'pointer'
                        }}
                      >ENGLISH</button>
                  </div>
              </div>
            </motion.div>
          )}

          {/* ══ APARIENCIA ══ */}
          {activeTab === 'appearance' && (
            <motion.div key="appearance" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* ─ Selector de Tema ─ */}
              <div style={panel}>
                <p style={sectionTitle}>Tema de color</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {Object.values(THEME_CONFIG).map((t) => {
                    const isActive = theme === t.id;
                    return (
                      <button key={t.id} onClick={() => setTheme(t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: `1px solid ${isActive ? t.brand + '60' : 'rgba(255,255,255,0.06)'}`,
                          background: isActive ? t.bg : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                          position: 'relative',
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.bg, border: `2px solid ${t.card}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.brand }} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: isActive ? t.brand : '#fff' }}>{t.name}</p>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>{t.description}</p>
                        </div>
                        {isActive && (
                          <div style={{ position: 'absolute', top: '8px', right: '10px', width: '16px', height: '16px', borderRadius: '50%', background: t.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={10} style={{ color: t.bg }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={panel}>
                <p style={sectionTitle}>Tipografía</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {Object.values(FONT_CONFIG).map((f) => {
                    const isActive = font === f.id;
                    return (
                      <button key={f.id} onClick={() => setFont(f.id)}
                        style={{
                          padding: '12px 14px', borderRadius: '12px',
                          border: `1px solid ${isActive ? 'rgba(var(--brand-rgb,0,208,132),0.4)' : 'rgba(255,255,255,0.06)'}`,
                          background: isActive ? 'rgba(var(--brand-rgb,0,208,132),0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                        }}
                      >
                        <p style={{ margin: '0 0 2px', fontFamily: f.family, fontSize: '1rem', fontWeight: 700, color: isActive ? 'var(--brand,#00D084)' : '#fff' }}>
                          {f.sample}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'var(--brand)' : 'rgba(255,255,255,0.6)' }}>{f.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ SEGURIDAD Y GESTIÓN DE USUARIOS ══ */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {user?.role === 'admin' && (
                  <div style={panel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <p style={sectionTitle}>{t('settings.user_management')}</p>
                        <button 
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--brand)', color: '#000', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
                        >
                            {showCreateForm ? t('common.cancel') : t('settings.create_user')}
                            {showCreateForm ? <X size={14} /> : <UserPlus size={14} />}
                        </button>
                      </div>

                      {showCreateForm && (
                          <motion.form 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }}
                            onSubmit={handleCreateUser}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
                          >
                              <div>
                                  <label style={labelStyle}>{t('settings.username')}</label>
                                  <input 
                                    style={inputStyle} 
                                    required 
                                    value={newUser.username} 
                                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label style={labelStyle}>{t('settings.role')}</label>
                                  <select 
                                    style={inputStyle} 
                                    value={newUser.role} 
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                  >
                                      <option value="staff" style={{background: '#000'}}>{t('settings.staff')}</option>
                                      <option value="admin" style={{background: '#000'}}>{t('settings.admin')}</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={labelStyle}>{t('settings.email')}</label>
                                  <input 
                                    type="email" 
                                    style={inputStyle} 
                                    value={newUser.email} 
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label style={labelStyle}>{t('settings.phone')}</label>
                                  <input 
                                    type="tel" 
                                    style={inputStyle} 
                                    value={newUser.phone} 
                                    onChange={e => setNewUser({...newUser, phone: e.target.value})}
                                  />
                              </div>
                              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                  <button type="submit" style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--brand)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                                      {t('settings.create_user')}
                                  </button>
                              </div>
                          </motion.form>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {isUsersLoading ? (
                              <Loader2 size={24} className="animate-spin" style={{ margin: '20px auto', color: 'var(--brand)' }} />
                          ) : (
                              users.map(u => (
                                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(var(--brand-rgb), 0.1)', border: '1px solid rgba(var(--brand-rgb), 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand)' }}>
                                              {u.username[0].toUpperCase()}
                                          </div>
                                          <div>
                                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>{u.username}</p>
                                              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--brand)', textTransform: 'uppercase', fontWeight: 800 }}>{u.role}</p>
                                          </div>
                                      </div>
                                      {u.id !== user.id && (
                                          <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            style={{ color: '#D4685A', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      )}
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}

              <div style={panel}>
                <p style={sectionTitle}>Seguridad de acceso</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '8px', color: 'rgba(255,255,255,0.15)' }}>
                  <Shield size={36} />
                  <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600 }}>Cambio de PIN</p>
                  <p style={{ margin: 0, fontSize: '0.75rem' }}>Disponible próximamente</p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div style={{ ...panel, background: 'rgba(212, 104, 90, 0.05)', border: '1px solid rgba(212, 104, 90, 0.2)' }}>
                  <p style={{ ...sectionTitle, color: '#D4685A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> {t('settings.risk_zone')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={handleBackup}
                      disabled={clearing}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,128,64,0.1)', border: '1px solid rgba(0,208,132, 0.2)', borderRadius: '10px', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700 }}>{t('settings.backup')}</p>
                      </div>
                      {clearing === 'backup' ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div key="services" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Services />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;
