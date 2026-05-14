import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Phone, Briefcase, X, Loader2,
  ChevronRight, Star, Pencil, Trash2, UserPlus, TrendingUp,
  MapPin, Mail
} from 'lucide-react';
import client from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useConfirmStore } from '../store/useConfirmStore';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', notes: '' };

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '11px 16px',
  color: '#fff',
  fontSize: '0.875rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.68rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '6px',
};

export default function Clients() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { ask } = useConfirmStore();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/clients');
      setClients(res.data);
    } catch (err) {
      addNotification('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingClient(c);
    setForm({ 
      name: `${c.first_name} ${c.last_name}`.trim(), 
      email: c.email || '', 
      phone: c.phone || '', 
      address: c.address || '', 
      notes: c.notes || '' 
    });
    setShowForm(true);
  };

  const openDetail = async (c) => {
    setSelected({ ...c, projects: [] });
    setDetailLoading(true);
    try {
      const res = await client.get(`/clients/${c.id}`);
      setSelected(res.data);
    } catch {
      // keep basic data
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return addNotification('El nombre es obligatorio', 'warning');
    
    const parts = form.name.trim().split(' ');
    const first_name = parts[0];
    const last_name = parts.length > 1 ? parts.slice(1).join(' ') : ' ';
    const payload = { ...form, first_name, last_name, client_type: 'Residential' };
    delete payload.name;
    
    setSaving(true);
    try {
      if (editingClient) {
        await client.put(`/clients/${editingClient.id}`, payload);
        addNotification(`"${form.name}" actualizado`, 'success');
      } else {
        await client.post('/clients', payload);
        addNotification(`"${form.name}" registrado`, 'success');
      }
      setShowForm(false);
      fetchClients();
    } catch (err) {
      addNotification('Error al guardar cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c) => {
    const fullName = `${c.first_name} ${c.last_name}`;
    ask({
      title: 'Eliminar Cliente',
      description: `¿Estás seguro de eliminar a "${fullName}"? Todo su historial podría verse afectado.`,
      onConfirm: async () => {
        try {
          await client.delete(`/clients/${c.id}`);
          addNotification(`"${fullName}" eliminado`, 'success');
          if (selected?.id === c.id) setSelected(null);
          fetchClients();
        } catch (err) {
          addNotification('No se puede eliminar el cliente', 'error');
        }
      }
    });
  };

  const filtered = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  });

  return (
    <div className="space-y-8 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Directorio GLE</p>
          <h1 className="text-4xl font-black text-white font-display uppercase tracking-tight">Clientes</h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-[#0A1A0F] border border-white/5 rounded-2xl px-6 py-3">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Registrados</p>
            <p className="text-xl font-black text-white leading-none">{clients.length}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-4 bg-brand text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-brand-glow hover:scale-105 transition-all"
          >
            <UserPlus size={14} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand transition-colors" size={18} />
        <input
          type="text"
          placeholder="BUSCAR POR NOMBRE, TELÉFONO O EMAIL..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-[11px] font-bold text-white focus:border-brand/40 outline-none transition-all placeholder:text-white/10 tracking-widest uppercase"
        />
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
          <Users size={48} className="mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">Sin resultados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand/30 transition-all group cursor-pointer relative overflow-hidden"
                onClick={() => openDetail(c)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-xl">
                      {(c.first_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-black text-lg leading-tight">{`${c.first_name} ${c.last_name}`}</p>
                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">{c.phone || 'Sin teléfono'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
                    className="p-2 text-red-500/50 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/30 text-[11px] font-medium">
                        <MapPin size={12} className="text-brand/40" />
                        <span className="truncate">{c.address || 'Sin dirección registrada'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/30 text-[11px] font-medium">
                        <Mail size={12} className="text-brand/40" />
                        <span className="truncate">{c.email || 'Sin email'}</span>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                  <ChevronRight size={20} className="text-white/10 group-hover:text-brand transition-colors" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal Form ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[2000] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A1A0F] border border-brand/20 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Registro'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label style={labelStyle}>Nombre Completo *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label style={labelStyle}>Teléfono</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
                    </div>
                </div>
                <div>
                  <label style={labelStyle}>Dirección de Propiedad</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Notas Internas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <button
                  type="submit" disabled={saving}
                  className="w-full py-5 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-brand-glow mt-4"
                >
                  {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : (editingClient ? 'Actualizar Cliente' : 'Registrar Cliente')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
