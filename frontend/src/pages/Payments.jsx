import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  Loader2, 
  TrendingUp,
  FileText,
  Briefcase,
  X
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import client from '../api/client';

const PAYMENT_METHODS = ['Cash', 'Zelle', 'Check', 'Transfer', 'PayPal'];

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '14px 18px',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 700,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.65rem',
  fontWeight: 800,
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  marginBottom: '8px',
};

export default function Payments() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projData, payData] = await Promise.all([
        projectsApi.getProjects(),
        client.get('/payments').then(r => r.data).catch(() => [])
      ]);
      setProjects(projData);
      setPayments(payData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      addNotification('Error al cargar datos financieros', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project) => {
    setSelectedProject(project);
    setAmount('');
    setCurrency('USD');
    setPaymentMethod('Cash');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return addNotification('Ingresa un monto válido', 'warning');
    }
    setSubmitting(true);
    try {
      const payload = {
        project_id: selectedProject.id,
        amount: parseFloat(amount),
        currency,
        payment_method: paymentMethod,
        notes: notes || null,
        exchange_rate: 1.0,
      };

      await projectsApi.createPayment(payload);

      addNotification(`Cobro de $${parseFloat(amount).toFixed(2)} ${currency} registrado`, 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addNotification('Error al registrar pago', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular cobrado por proyecto (usando los pagos del proyecto embebidos)
  const getProjectCobrado = (project) => {
    const pays = project.payments || [];
    const usd = pays.filter(p => p.currency === 'USD').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const mxn = pays.filter(p => p.currency === 'MXN').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    return { usd, mxn };
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="text-brand animate-spin" size={48} />
    </div>
  );

  const activeProjects = projects.filter(p => p.status !== 'Cancelled' && p.status !== 'Completed');

  return (
    <div className="space-y-10 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Finanzas GLE</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Control de Caja</h1>
          <p className="text-white/30 text-sm mt-1">Gestión de cobros y saldos de proyectos</p>
        </div>

        {/* Resumen rápido */}
        <div className="flex gap-4">
          <div className="bg-[#0A1A0F] border border-white/5 rounded-2xl px-6 py-4 text-center">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Total Cobrado</p>
            <p className="text-xl font-black text-brand">
              ${payments.filter(p => p.currency === 'USD').reduce((s, p) => s + parseFloat(p.amount || 0), 0).toFixed(2)} USD
            </p>
          </div>
          <div className="bg-[#0A1A0F] border border-white/5 rounded-2xl px-6 py-4 text-center">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Cobros</p>
            <p className="text-xl font-black text-white">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Proyectos Activos */}
      <div className="space-y-6">
        <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
          <Briefcase size={16} className="text-brand" /> Proyectos Activos ({activeProjects.length})
        </h2>

        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Briefcase size={48} className="mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">No hay proyectos activos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeProjects.map((project, i) => {
              const cobrado = getProjectCobrado(project);
              const pendiente = parseFloat(project.total_quoted_usd || 0) - cobrado.usd;
              const clientName = project.client
                ? `${project.client.first_name} ${project.client.last_name}`
                : 'Sin cliente';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <FileText className="text-brand/40" size={22} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-base mb-1 leading-tight">{project.title}</h4>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{clientName}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-brand/10 border-brand/20 text-brand whitespace-nowrap">
                      {project.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Cotizado</p>
                      <p className="text-base font-black text-white">${parseFloat(project.total_quoted_usd || 0).toFixed(2)}</p>
                      <p className="text-[9px] text-white/20">USD</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Cobrado</p>
                      <p className="text-base font-black text-brand">${cobrado.usd.toFixed(2)}</p>
                      <p className="text-[9px] text-white/20">USD</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Pendiente</p>
                      <p className={`text-base font-black ${pendiente > 0 ? 'text-[#D4A050]' : 'text-brand'}`}>
                        ${Math.max(pendiente, 0).toFixed(2)}
                      </p>
                      <p className="text-[9px] text-white/20">USD</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((cobrado.usd / Math.max(parseFloat(project.total_quoted_usd || 0), 1)) * 100, 100)}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleOpenModal(project)}
                    className="w-full py-4 bg-brand text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-brand-glow hover:scale-105 active:scale-95 transition-all"
                  >
                    + Registrar Cobro
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de Pagos */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
            <CreditCard size={16} className="text-brand" /> Historial de Cobros
          </h2>
          <div className="space-y-3">
            {payments.slice(0, 20).map((pay, i) => (
              <motion.div
                key={pay.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#0A1A0F] border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <DollarSign size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{pay.payment_method || 'Cash'}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      {new Date(pay.timestamp).toLocaleDateString()} · Proyecto #{pay.project_id}
                    </p>
                    {pay.notes && <p className="text-white/20 text-[10px] italic mt-0.5">{pay.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-brand font-black text-lg">${parseFloat(pay.amount).toFixed(2)}</p>
                  <p className="text-white/20 text-[10px] font-black">{pay.currency}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Cobro */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[2000] p-4"
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-lg bg-[#0A1A0F] border border-brand/20 rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Registrar Cobro</h2>
                  <p className="text-brand/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {selectedProject?.title}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/20 hover:text-white p-2">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Monto y moneda */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 900 }}
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Moneda</label>
                    <div className="flex gap-2 mt-1">
                      {['USD', 'MXN'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className="flex-1 py-3 rounded-2xl font-black text-sm uppercase transition-all"
                          style={{
                            background: currency === c ? 'var(--brand)' : 'rgba(255,255,255,0.05)',
                            color: currency === c ? '#000' : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${currency === c ? 'var(--brand)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div>
                  <label style={labelStyle}>Método de Pago</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className="px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all"
                        style={{
                          background: paymentMethod === m ? 'rgba(var(--brand-rgb),0.15)' : 'rgba(255,255,255,0.04)',
                          color: paymentMethod === m ? 'var(--brand)' : 'rgba(255,255,255,0.35)',
                          border: `1px solid ${paymentMethod === m ? 'rgba(var(--brand-rgb),0.4)' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label style={labelStyle}>Referencia / Notas</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Referencia de transferencia, número de cheque..."
                    style={inputStyle}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !amount}
                    className="flex-1 py-4 bg-brand text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-brand-glow hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Confirmar Cobro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
