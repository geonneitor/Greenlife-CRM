import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText, User, Calendar, ChevronRight, X, Printer, CheckCircle2, Trash2 } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { useNotificationStore } from '../store/useNotificationStore';

const QuoteDocumentModal = ({ quote, onClose, onApprove, loading }) => {
  if (!quote) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[2000] p-4 print:p-0 print:bg-white"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-3xl bg-[#0A1A0F] border border-brand/20 rounded-[3rem] p-10 relative max-h-[85vh] overflow-y-auto print:max-h-none print:h-auto print:border-none print:bg-white print:text-black print:rounded-none"
      >
        <div className="absolute top-8 right-8 flex gap-4 no-print">
            <button onClick={handlePrint} className="text-white/40 hover:text-brand transition-colors"><Printer size={24} /></button>
            <button onClick={onClose} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* HEADER DEL DOCUMENTO */}
        <div className="mb-12 border-b border-white/10 pb-8 print:border-black/10">
            <h1 className="text-4xl font-black text-brand uppercase tracking-tighter mb-2 print:text-black">COTIZACIÓN</h1>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest print:text-black/50">ID: #{quote.id.toString().padStart(5, '0')} · {new Date(quote.created_at || Date.now()).toLocaleDateString()}</p>
        </div>

        {/* INFO DEL CLIENTE Y PROYECTO */}
        <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
                <p className="text-[9px] font-black text-white/30 uppercase mb-2 print:text-black/40">Preparado para</p>
                <p className="text-xl font-bold text-white print:text-black">{quote.client?.name || 'Cliente General'}</p>
                {quote.client?.email && <p className="text-sm text-white/60 print:text-black/60">{quote.client.email}</p>}
                {quote.client?.phone && <p className="text-sm text-white/60 print:text-black/60">{quote.client.phone}</p>}
            </div>
            <div>
                <p className="text-[9px] font-black text-white/30 uppercase mb-2 print:text-black/40">Descripción del Proyecto</p>
                <p className="text-lg font-bold text-white mb-2 print:text-black">{quote.title}</p>
                <p className="text-sm text-white/60 print:text-black/60">{quote.description || 'Sin descripción adicional.'}</p>
            </div>
        </div>

        {/* TABLA DE SERVICIOS */}
        <div className="mb-12">
            <div className="flex justify-between border-b border-white/10 pb-3 mb-4 print:border-black/20">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest print:text-black/60">Servicio</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest print:text-black/60">Subtotal</p>
            </div>
            
            <div className="space-y-4">
                {quote.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <div>
                            <p className="text-white font-bold text-sm print:text-black">{item.service?.name || 'Servicio General'}</p>
                            <p className="text-white/40 text-[10px] print:text-black/50">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="text-white font-black print:text-black">${(item.price_at_quote_usd * item.quantity).toFixed(2)} USD</p>
                    </div>
                ))}
            </div>
        </div>

        {/* TOTALES */}
        <div className="flex justify-end border-t border-white/10 pt-6 mb-12 print:border-black/20">
            <div className="text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 print:text-black/50">Total Estimado</p>
                <p className="text-4xl font-black text-brand print:text-black">${quote.total_quoted_usd.toFixed(2)} <span className="text-sm opacity-50">USD</span></p>
            </div>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-4 pt-6 border-t border-white/5 no-print">
            <button 
                onClick={() => onApprove(quote.id)}
                disabled={loading}
                className="flex-1 py-5 bg-brand text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-brand-glow flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Aprobar y Convertir en Proyecto</>}
            </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Quotes() {
  const { addNotification } = useNotificationStore();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getProjects({ status: 'Estimate' });
      setQuotes(data.filter(p => p.status === 'Estimate'));
    } catch (err) {
      addNotification('Error al cargar cotizaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotes() }, [fetchQuotes]);

  const handleApprove = async (projectId) => {
    setActionLoading(true);
    try {
      await projectsApi.updateProjectStatus(projectId, 'In Progress');
      addNotification('Cotización aprobada. Proyecto en progreso.', 'success');

      fetchQuotes();
      setSelectedQuote(null);
    } catch (err) {
      addNotification('Error al aprobar cotización', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="text-brand animate-spin" size={48} />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Cotizaciones Pendientes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quotes.map(quote => (
            <motion.div
                key={quote.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedQuote(quote)}
                className="bg-[#0A1A0F] border border-white/5 rounded-[2rem] p-8 hover:border-brand/40 transition-all cursor-pointer relative group overflow-hidden"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-[#D4A050]/10 border border-[#D4A050]/20 text-[#D4A050] mb-3 inline-block">
                            Pendiente
                        </span>
                        <h4 className="text-white font-bold text-xl mb-1">{quote.title}</h4>
                        <p className="text-white/40 text-xs flex items-center gap-2"><User size={12}/> {quote.client?.name || 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                        <FileText size={20} className="text-white/40 group-hover:text-brand transition-colors" />
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Monto Estimado</p>
                        <p className="text-2xl font-black text-white">${quote.total_quoted_usd.toFixed(2)} <span className="text-[10px] text-white/30">USD</span></p>
                    </div>
                    <ChevronRight size={24} className="text-white/10 group-hover:text-brand transition-transform group-hover:translate-x-2" />
                </div>
            </motion.div>
        ))}

        {quotes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <FileText size={48} className="text-white/10 mb-4" />
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No hay cotizaciones pendientes</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {selectedQuote && (
            <QuoteDocumentModal 
                quote={selectedQuote} 
                onClose={() => setSelectedQuote(null)}
                onApprove={handleApprove}
                loading={actionLoading}
            />
        )}
      </AnimatePresence>
    </div>
  )
}
