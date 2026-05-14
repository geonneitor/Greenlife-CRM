import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Filter, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  Search,
  ExternalLink,
  MoreVertical,
  Check,
  XCircle,
  Briefcase
} from 'lucide-react';
import { leadsApi } from '../api/leads';
import { useNotificationStore } from '../store/useNotificationStore';

const StatusBadge = ({ status }) => {
  const styles = {
    'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Contacted': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Quoted': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Converted': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status] || styles['New']}`}>
      {status}
    </span>
  );
};

export default function LeadsDashboard() {
  const { addNotification } = useNotificationStore();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getLeads();
      setLeads(data);
    } catch (err) {
      addNotification('Error al cargar prospectos', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { fetchLeads() }, [fetchLeads]);

  const handleStatusUpdate = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await leadsApi.updateLead(id, { status: newStatus });
      addNotification(`Estado actualizado a ${newStatus}`, 'success');
      fetchLeads();
    } catch (err) {
      addNotification('Error al actualizar estado', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvert = async (id) => {
    setActionLoading(id);
    try {
      await leadsApi.convertLead(id);
      addNotification('Lead convertido a Proyecto exitosamente', 'success');
      fetchLeads();
    } catch (err) {
      addNotification('Error al convertir lead', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading && leads.length === 0) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="text-brand animate-spin" size={48} />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestión de Leads</h2>
          <p className="text-white/40 text-sm">Control de prospectos y solicitudes desde la web</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['All', 'New', 'Contacted', 'Quoted', 'Converted'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filterStatus === status 
                  ? 'bg-brand text-black border-brand' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A1A0F] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map(lead => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A1A0F] border border-white/5 rounded-[2rem] p-6 hover:border-brand/20 transition-all group"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Info Principal */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-brand">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-bold text-lg">{lead.name}</h4>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Mail size={12}/> {lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone size={12}/> {lead.phone}</span>}
                      <span className="flex items-center gap-1"><Clock size={12}/> {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Detalles de Servicio */}
                <div className="flex-1 px-4 border-l border-white/5">
                  <p className="text-[10px] font-black text-white/20 uppercase mb-1">Servicio Solicitado</p>
                  <p className="text-white text-sm font-medium">{lead.service_type || 'No especificado'}</p>
                  {lead.message && (
                    <p className="text-white/40 text-xs mt-1 line-clamp-1 italic">"{lead.message}"</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {lead.status === 'New' && (
                    <button 
                      onClick={() => handleStatusUpdate(lead.id, 'Contacted')}
                      disabled={actionLoading === lead.id}
                      className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl hover:bg-yellow-500/20 transition-colors title='Marcar como Contactado'"
                    >
                      {actionLoading === lead.id ? <Loader2 className="animate-spin" size={18}/> : <MessageSquare size={18} />}
                    </button>
                  )}
                  
                  {['Contacted', 'New'].includes(lead.status) && (
                    <button 
                      onClick={() => handleStatusUpdate(lead.id, 'Quoted')}
                      disabled={actionLoading === lead.id}
                      className="p-3 bg-purple-500/10 text-purple-500 rounded-xl hover:bg-purple-500/20 transition-colors title='Marcar como Cotizado'"
                    >
                      <Briefcase size={18} />
                    </button>
                  )}

                  {lead.status !== 'Converted' && lead.status !== 'Rejected' && (
                    <>
                      <button 
                        onClick={() => handleConvert(lead.id)}
                        disabled={actionLoading === lead.id}
                        className="flex items-center gap-2 px-6 py-3 bg-brand text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.05] transition-all shadow-brand-glow"
                      >
                        {actionLoading === lead.id ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14} />}
                        Convertir
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(lead.id, 'Rejected')}
                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}

                  {lead.status === 'Converted' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase">
                      <Check size={14} /> Convertido
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLeads.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <Filter size={48} className="text-white/10 mb-4" />
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No se encontraron prospectos</p>
          </div>
        )}
      </div>
    </div>
  );
}
