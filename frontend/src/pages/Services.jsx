import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Search, Plus, X, Loader2,
  Pencil, Trash2, DollarSign, TrendingUp,
  Tag, Info
} from 'lucide-react';
import { servicesApi } from '../api/services';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

const EMPTY_SERVICE = {
  name: '', category: 'Maintenance', 
  description: '', base_price_usd: '', base_price_mxn: ''
}

const ServiceForm = ({ initial = EMPTY_SERVICE, onSave, onClose, loading }) => {
  const [form, setForm] = useState(initial)
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      base_price_usd: parseFloat(form.base_price_usd || 0),
      base_price_mxn: parseFloat(form.base_price_mxn || 0),
    })
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
    padding: '14px 18px', color: '#fff', fontSize: '0.9rem', fontWeight: 600,
    outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = {
    display: 'block', fontSize: '0.7rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '8px'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label style={labelStyle}>Nombre del Servicio *</label>
        <input required placeholder="Ej: Corte de Césped Premium" value={form.name}
          onChange={e => set('name', e.target.value)} style={inputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Categoría</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, background: '#0A1A0F' }}>
            <option value="Maintenance">Mantenimiento</option>
            <option value="Design">Diseño/Paisajismo</option>
            <option value="Cleanup">Limpieza</option>
            <option value="Installation">Instalación</option>
            <option value="Other">Otro</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Precio Base USD ($)</label>
          <input type="number" step="0.01" value={form.base_price_usd}
            onChange={e => set('base_price_usd', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Precio Base MXN ($)</label>
        <input type="number" step="0.01" value={form.base_price_mxn}
          onChange={e => set('base_price_mxn', e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Descripción Detallada</label>
        <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="¿Qué incluye este servicio?..." style={{ ...inputStyle, resize: 'none' }} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-5 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-brand-glow mt-4"
      >
        {loading ? <Loader2 className="animate-spin mx-auto" /> : (initial.id ? 'Actualizar Servicio' : 'Registrar Servicio')}
      </button>
    </form>
  )
}

export default function Services() {
  const { addNotification } = useNotificationStore()
  const { user } = useAuthStore()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await servicesApi.getServices()
      setServices(data)
    } catch (err) {
      addNotification('Error al cargar servicios', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingService) {
        await servicesApi.updateService(editingService.id, payload)
        addNotification('Servicio actualizado', 'success')
      } else {
        await servicesApi.createService(payload)
        addNotification('Servicio creado', 'success')
      }
      setShowForm(false)
      setEditingService(null)
      fetchServices()
    } catch (err) {
      addNotification('Error al guardar el servicio', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!window.confirm(`¿Eliminar "${s.name}"?`)) return
    try {
      await servicesApi.deleteService(s.id)
      addNotification('Servicio eliminado', 'success')
      fetchServices()
    } catch (err) {
      addNotification('No se pudo eliminar el servicio', 'error')
    }
  }

  const filtered = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="text-brand animate-spin" size={48} />
    </div>
  )

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Catálogo</h1>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">Servicios Disponibles</p>
        </div>
        <button 
          onClick={() => { setEditingService(null); setShowForm(true) }}
          className="flex items-center gap-2 px-8 py-4 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-brand-glow hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nuevo Servicio
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand" size={20} />
        <input 
          placeholder="BUSCAR POR NOMBRE O CATEGORÍA..." 
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-[11px] font-bold text-white outline-none focus:border-brand/40 tracking-widest uppercase"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(s => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand/30 transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="text-brand" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg leading-tight">{s.name}</h3>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">{s.category}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingService(s); setShowForm(true) }} className="p-2 text-white/30 hover:text-brand bg-white/5 rounded-full"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(s)} className="p-2 text-white/30 hover:text-red-400 bg-white/5 rounded-full"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
              <div>
                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Precio USD</p>
                <p className="text-xl font-black text-brand">${s.base_price_usd}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Precio MXN</p>
                <p className="text-xl font-black text-[#D4A050]">${s.base_price_mxn}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-white/20 text-[10px] leading-relaxed line-clamp-2">{s.description || 'Sin descripción detallada.'}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[2000] p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0A1A0F] border border-brand/20 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X size={24} /></button>
              </div>
              <ServiceForm initial={editingService || EMPTY_SERVICE} onSave={handleSave} onClose={() => setShowForm(false)} loading={saving} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
