import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon, ChevronRight, ChevronDown,
  Calendar, Tag, Loader2, Briefcase, X, RefreshCw, CheckCircle2,
  MapPin, Clock, User, Download
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { generateQuotePDF } from '../services/quotePDF';

const ProjectDetailModal = ({ project, onClose, onUpdateStatus, loading, onDownloadPDF }) => {
  const [financials, setFinancials] = useState(null)
  const [loadingFin, setLoadingFin] = useState(false)

  useEffect(() => {
    if (project && project.id && project.status !== 'Estimate') {
      const fetchFin = async () => {
        setLoadingFin(true)
        try {
          const res = await projectsApi.getProjectFinancials(project.id)
          setFinancials(res)
        } catch (error) {
          console.error("Error fetching financials", error)
        } finally {
          setLoadingFin(false)
        }
      }
      fetchFin()
    }
  }, [project])

  if (!project) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[2000] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#0A1A0F] border border-brand/20 rounded-[3rem] p-10 relative max-h-[85vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white"><X size={24} /></button>

        <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2">Proyecto #{project.id}</p>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-8">{project.title}</h2>

        <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-white/20 uppercase mb-2">Cliente</p>
                <div className="flex items-center gap-3">
                    <User size={16} className="text-brand" />
                    <span className="text-white font-bold">{project.client ? `${project.client.first_name} ${project.client.last_name}` : 'Venta General'}</span>
                </div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-white/20 uppercase mb-2">Estatus Actual</p>
                <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#D4A050]" />
                    <span className="text-white font-bold uppercase text-xs">{project.status}</span>
                </div>
            </div>
        </div>

        <div className="space-y-6 mb-10">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Desglose de Servicios</p>
            {project.items?.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                        <p className="text-white font-bold text-sm">{item.service?.name || 'Servicio'}</p>
                        <p className="text-white/40 text-[10px]">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-brand font-black">${(item.price_at_quote_usd * item.quantity).toFixed(2)} USD</p>
                </div>
            ))}
        </div>

        {project.status !== 'Estimate' && (
            <div className="space-y-4 mb-10">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">Resumen Financiero (Ganancia Real)</p>
                {loadingFin ? (
                    <div className="flex items-center gap-2 text-white/40 text-xs"><Loader2 className="animate-spin" size={14} /> Calculando...</div>
                ) : financials ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-white/40 uppercase mb-1">Cotizado</p>
                            <p className="text-sm font-black text-white">${financials.total_quoted_usd.toFixed(2)}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-white/40 uppercase mb-1">Cobrado</p>
                            <p className="text-sm font-black text-white">${financials.total_payments_usd.toFixed(2)}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-[#D4685A] uppercase mb-1">Gastos Operativos</p>
                            <p className="text-sm font-black text-[#D4685A]">${financials.total_expenses_usd.toFixed(2)}</p>
                        </div>
                        <div className="bg-brand/10 p-4 rounded-xl border border-brand/20">
                            <p className="text-[8px] font-black text-brand uppercase mb-1">Ganancia Neta</p>
                            <p className="text-sm font-black text-brand">${financials.profit_usd.toFixed(2)} <span className="text-[9px]">({financials.margin_percentage.toFixed(1)}%)</span></p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-white/40">No se pudieron cargar los datos financieros.</p>
                )}
            </div>
        )}

        <div className="flex gap-4 pt-6 border-t border-white/5 flex-wrap">
            {project.status !== 'Completed' && (
                <button 
                    onClick={() => onUpdateStatus(project.id, 'Completed')}
                    disabled={loading}
                    className="flex-1 py-5 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-brand-glow flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Marcar como Finalizado</>}
                </button>
            )}
            <button 
                onClick={onDownloadPDF}
                className="px-6 py-5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all"
            >
                <Download size={16} /> PDF
            </button>
            <button onClick={onClose} className="px-8 py-5 bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-widest rounded-2xl">Cerrar</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function History() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const { rate } = useExchangeRate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [filter, setFilter] = useState('All')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await projectsApi.getProjects()
      setProjects(data)
    } catch (err) {
      addNotification('Error al cargar historial', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleUpdateStatus = async (projectId, status) => {
    setActionLoading(true)
    try {
      await projectsApi.updateProjectStatus(projectId, status)
      addNotification('Estado actualizado', 'success')
      fetchProjects()
      setSelectedProject(null)
    } catch (err) {
      addNotification('Error al actualizar estado', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = projects.filter(p => {
    if (filter === 'All') return true
    return p.status === filter
  })

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="text-brand animate-spin" size={48} />
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
            {['All', 'Estimate', 'In Progress', 'Completed', 'Cancelled', 'Maintenance'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${filter === f ? 'bg-brand text-black' : 'text-white/40'}`}>{f === 'All' ? 'Todos' : f}</button>
            ))}
        </div>

        <button onClick={fetchProjects} className="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-brand"><RefreshCw size={18} /></button>
      </div>

      <div className="space-y-4">
        {filtered.map(project => (
            <motion.div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-[#0A1A0F] border border-white/5 rounded-[2rem] p-8 hover:border-brand/20 transition-all flex flex-col md:flex-row items-start md:items-center gap-8 group cursor-pointer relative overflow-hidden"
            >
                <div className="flex items-center gap-6 flex-1 min-w-0 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex flex-col items-center justify-center shrink-0 border border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase mb-1">ID</span>
                        <span className="text-xl font-black text-white">#{project.id}</span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-white font-bold text-lg truncate">{project.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${project.status === 'Completed' ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-[#D4A050]/10 border-[#D4A050]/20 text-[#D4A050]'}`}>

                                {project.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><User size={12} /> {project.client ? `${project.client.first_name} ${project.client.last_name}` : 'N/A'}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Sin fecha'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10 relative z-10">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-white/20 uppercase mb-1">Presupuesto</p>
                        <p className="text-xl font-black text-white">${project.total_quoted_usd.toFixed(2)} <span className="text-[10px] opacity-30">USD</span></p>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-brand transition-all" />
                </div>
            </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProject && (
            <ProjectDetailModal 
                project={selectedProject} 
                onClose={() => setSelectedProject(null)}
                onUpdateStatus={handleUpdateStatus}
                loading={actionLoading}
                onDownloadPDF={() => {
                  try {
                    generateQuotePDF(selectedProject, rate)
                    addNotification('PDF generado correctamente', 'success')
                  } catch {
                    addNotification('Error al generar PDF', 'error')
                  }
                }}
            />
        )}
      </AnimatePresence>
    </div>
  )
}
